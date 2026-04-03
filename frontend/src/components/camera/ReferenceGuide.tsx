/**
 * components/camera/ReferenceGuide.tsx – Instrução de objeto de referência.
 *
 * Orienta o usuário a incluir um objeto de referência na foto (moeda, talheres)
 * para melhorar a estimativa de volume dos alimentos.
 *
 * TODO: implementar com ilustrações e toggle.
 */

/**
 * Guia visual para objeto de referência na foto.
 */
export function ReferenceGuide() {
  return (
    <div className="glass p-4 text-sm text-slate-300">
      <h3 className="font-semibold text-white mb-2">🪙 Dica de precisão</h3>
      <p>
        Coloque uma moeda de R$1 ou um garfo ao lado do prato.
        Isso ajuda a estimar melhor o volume dos alimentos.
      </p>
      {/* TODO: ilustração, checkbox "inclui objeto de referência" */}
    </div>
  );
}
