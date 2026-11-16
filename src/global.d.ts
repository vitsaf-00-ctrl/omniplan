declare global {
  interface Window {
    __setKeyboardSelectedId: ((id: string | null) => void) | undefined;
    __notifySelectedId: ((id: string | null) => void) | undefined;
  }
}

export {};
