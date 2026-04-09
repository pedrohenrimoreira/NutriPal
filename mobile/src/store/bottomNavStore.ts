import { create } from "zustand";

export type BottomNavMode = "expanded" | "compact";

interface BottomNavState {
  keyboardVisible: boolean;
  mode: BottomNavMode;
  reset: () => void;
  setKeyboardVisible: (visible: boolean) => void;
  setMode: (mode: BottomNavMode) => void;
}

export const useBottomNavStore = create<BottomNavState>((set) => ({
  keyboardVisible: false,
  mode: "expanded",
  reset: () => {
    set({
      keyboardVisible: false,
      mode: "expanded",
    });
  },
  setKeyboardVisible: (visible) => {
    set((state) => (
      state.keyboardVisible === visible
        ? state
        : { keyboardVisible: visible }
    ));
  },
  setMode: (mode) => {
    set((state) => (
      state.mode === mode
        ? state
        : { mode }
    ));
  },
}));
