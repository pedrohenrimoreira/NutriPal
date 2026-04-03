/**
 * components/ui/GlassCard.tsx – Card com efeito Liquid Glass.
 *
 * Usa backdrop-filter nativo para criar o efeito de vidro fosco.
 * Não depende de bibliotecas de estilo externas.
 *
 * Uso: envolver conteúdo que deve ter aparência "glass" sobre o fundo escuro.
 */

import type { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card com efeito glass/blur.
 * TODO: implementar variantes (elevated, flat, interactive com hover).
 */
export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`glass p-4 ${className}`}>
      {children}
    </div>
  );
}
