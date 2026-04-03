/**
 * components/camera/CameraCapture.tsx – Full-screen camera overlay.
 *
 * Displays a full-screen camera preview with capture, close, and flip controls.
 * Includes a dismissible ReferenceGuide tooltip at the top.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { useCamera } from '../../hooks/useCamera';
import { ReferenceGuide } from './ReferenceGuide';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (blob: Blob) => void;
}

export function CameraCapture({ isOpen, onClose, onCapture }: CameraCaptureProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [showGuide, setShowGuide] = useState(true);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const closingRef = useRef(false);

  const { videoRef, isActive, error, startCamera, stopCamera, captureFrame } =
    useCamera(facingMode);

  // Handle open/close with animation
  useEffect(() => {
    if (isOpen) {
      closingRef.current = false;
      setVisible(true);
      // Trigger animation on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimateIn(true);
        });
      });
      startCamera();
    } else {
      setAnimateIn(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => {
        if (!closingRef.current) {
          stopCamera();
          setVisible(false);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, startCamera, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleClose = useCallback(() => {
    closingRef.current = true;
    stopCamera();
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      onClose();
    }, 300);
  }, [onClose, stopCamera]);

  const handleCapture = useCallback(async () => {
    const blob = await captureFrame();
    if (blob) {
      onCapture(blob);
      handleClose();
    }
  }, [captureFrame, onCapture, handleClose]);

  const handleFlip = useCallback(() => {
    stopCamera();
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, [stopCamera]);

  // Restart camera when facingMode changes (only while open)
  useEffect(() => {
    if (isOpen && visible) {
      startCamera();
    }
  }, [facingMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRetry = useCallback(() => {
    startCamera();
  }, [startCamera]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{
        background: 'var(--bg-primary)',
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      {/* Camera video feed */}
      {!error && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
          <div className="glass-elevated rounded-2xl p-6 text-center max-w-sm">
            <div className="text-3xl mb-3">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <p className="text-sm text-slate-300 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="glass-interactive px-5 py-2.5 rounded-full text-sm font-medium text-white"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Top area: Reference Guide (dismissible) */}
      {showGuide && !error && (
        <div className="relative z-10 p-4 animate-fade-in">
          <div className="relative">
            <ReferenceGuide />
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-white"
              style={{ background: 'rgba(0,0,0,0.4)' }}
              aria-label="Fechar dica"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <line x1="2" y1="2" x2="10" y2="10" />
                <line x1="10" y1="2" x2="2" y2="10" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom action bar */}
      <div
        className="relative z-10 pb-safe"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
        }}
      >
        <div
          className="flex items-center justify-between px-8 py-6"
          style={{
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="glass-interactive w-12 h-12 rounded-full flex items-center justify-center"
            aria-label="Fechar camera"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>

          {/* Capture button (iOS-style white circle) */}
          <button
            onClick={handleCapture}
            disabled={!isActive}
            className="relative flex items-center justify-center"
            aria-label="Capturar foto"
            style={{ width: 72, height: 72 }}
          >
            {/* Outer ring */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                border: '4px solid rgba(255,255,255,0.8)',
              }}
            />
            {/* Inner circle */}
            <span
              className="rounded-full transition-transform duration-150 active:scale-90"
              style={{
                width: 58,
                height: 58,
                background: isActive ? '#ffffff' : 'rgba(255,255,255,0.3)',
              }}
            />
          </button>

          {/* Flip camera button */}
          <button
            onClick={handleFlip}
            className="glass-interactive w-12 h-12 rounded-full flex items-center justify-center"
            aria-label="Alternar camera"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 4v6h6" />
              <path d="M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10" />
              <path d="M3.51 15A9 9 0 0 0 18.36 18.36L23 14" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
