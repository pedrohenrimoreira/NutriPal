/**
 * store/uiStore.ts – Zustand store para estado da interface.
 *
 * Gerencia estados transitórios de UI:
 * - Loading global / por operação
 * - Modal ativo (câmera, confirmação, etc.)
 * - Toast / notificação
 * - Tela ativa (quando não usarmos react-router)
 *
 * Biblioteca: Zustand (https://github.com/pmndrs/zustand)
 */

import { create } from 'zustand';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActiveScreen = 'journal' | 'history' | 'settings';

export type ModalType = 'camera' | 'confirm_delete' | 'food_detail' | null;

export interface UiState {
  /** Tela ativa no app. */
  activeScreen: ActiveScreen;
  /** Se há uma operação assíncrona global em andamento. */
  isLoading: boolean;
  /** Mensagem de loading (opcional). */
  loadingMessage: string | null;
  /** Modal aberto no momento. */
  activeModal: ModalType;

  // Actions
  setScreen: (screen: ActiveScreen) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useUiStore = create<UiState>((set) => ({
  activeScreen: 'journal',
  isLoading: false,
  loadingMessage: null,
  activeModal: null,

  setScreen: (screen) => set({ activeScreen: screen }),

  setLoading: (isLoading, message) =>
    set({ isLoading, loadingMessage: message ?? null }),

  openModal: (modal) => set({ activeModal: modal }),

  closeModal: () => set({ activeModal: null }),
}));
