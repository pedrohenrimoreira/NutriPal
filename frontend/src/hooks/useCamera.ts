/**
 * hooks/useCamera.ts – Hook para acesso à câmera do dispositivo.
 *
 * Usa a API MediaDevices do browser para:
 * - Solicitar permissão de câmera
 * - Obter stream de vídeo (preferencialmente câmera traseira)
 * - Capturar um frame como Blob (JPEG)
 * - Liberar a câmera ao desmontar
 *
 * API: navigator.mediaDevices.getUserMedia()
 */

import { useRef, useState, useCallback, useEffect } from 'react';

export interface UseCameraReturn {
  /** Ref para o elemento <video> que exibe o preview. */
  videoRef: React.RefObject<HTMLVideoElement>;
  /** Se a câmera está ativa. */
  isActive: boolean;
  /** Erro ao acessar a câmera, se houver. */
  error: string | null;
  /** Inicia o stream da câmera. */
  startCamera: () => Promise<void>;
  /** Para o stream e libera recursos. */
  stopCamera: () => void;
  /** Captura o frame atual do vídeo como Blob JPEG. */
  captureFrame: () => Promise<Blob | null>;
}

/**
 * Hook para controle da câmera do dispositivo.
 *
 * @param facingMode - 'environment' (traseira) ou 'user' (frontal). Default: 'environment'
 * @returns controles e estado da câmera
 */
export function useCamera(facingMode: 'environment' | 'user' = 'environment'): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsActive(true);
    } catch (err: unknown) {
      let message = 'Não foi possível acessar a câmera.';

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            message = 'Permissão para acessar a câmera foi negada. Verifique as configurações do navegador.';
            break;
          case 'NotFoundError':
            message = 'Nenhuma câmera foi encontrada no dispositivo.';
            break;
          case 'NotReadableError':
            message = 'A câmera está sendo usada por outro aplicativo.';
            break;
          case 'OverconstrainedError':
            message = 'Nenhuma câmera atende aos requisitos solicitados.';
            break;
          case 'AbortError':
            message = 'O acesso à câmera foi interrompido.';
            break;
          case 'SecurityError':
            message = 'O acesso à câmera foi bloqueado por restrições de segurança.';
            break;
        }
      }

      setError(message);
      setIsActive(false);
    }
  }, [facingMode]);

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !isActive) {
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        'image/jpeg',
        0.85,
      );
    });
  }, [isActive]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return { videoRef, isActive, error, startCamera, stopCamera, captureFrame };
}
