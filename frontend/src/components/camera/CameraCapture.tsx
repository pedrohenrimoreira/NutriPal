/**
 * components/camera/CameraCapture.tsx – Interface de captura de foto.
 *
 * Exibe o preview da câmera e botão de captura.
 * Usa o hook useCamera para controlar o stream.
 *
 * TODO: implementar overlay com guia de enquadramento.
 */

/**
 * UI de captura de foto do prato.
 */
export function CameraCapture() {
  // TODO: integrar useCamera hook
  return (
    <div className="flex flex-col items-center gap-4">
      {/* TODO: <video ref={videoRef} /> com preview da câmera */}
      <div className="w-full aspect-[4/3] bg-slate-800 rounded-xl flex items-center justify-center">
        <span className="text-slate-500">Preview da câmera</span>
      </div>
      <button className="px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-full text-sm font-medium transition-colors">
        📸 Capturar
      </button>
    </div>
  );
}
