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
  videoRef: React.RefObject<HTMLVideoElement | null>;
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
 *
 * TODO: implement corpo das funções
 */
export function useCamera(_facingMode: 'environment' | 'user' = 'environment'): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    // TODO: implement – getUserMedia({ video: { facingMode } })
    // Atribuir stream ao videoRef.current.srcObject
    void setIsActive;
    void setError;
    throw new Error('TODO: implement startCamera');
  }, []);

  const stopCamera = useCallback(() => {
    // TODO: implement – parar todas as tracks do stream
    throw new Error('TODO: implement stopCamera');
  }, []);

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    // TODO: implement – criar canvas, drawImage do vídeo, toBlob('image/jpeg')
    throw new Error('TODO: implement captureFrame');
  }, []);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      // TODO: chamar stopCamera() quando implementado
    };
  }, []);

  return { videoRef, isActive, error, startCamera, stopCamera, captureFrame };
}
