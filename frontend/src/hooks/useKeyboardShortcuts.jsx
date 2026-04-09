import { useEffect } from 'react';

/**
 * Register global keyboard shortcuts.
 * @param {Array<{ key: string, ctrl?: boolean, handler: () => void }>} shortcuts
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when typing in inputs, textareas, selects, or contentEditable
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      for (const s of shortcuts) {
        if (s.ctrl && !e.ctrlKey && !e.metaKey) continue;
        if (e.key.toLowerCase() === s.key.toLowerCase()) {
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shortcuts]);
}
