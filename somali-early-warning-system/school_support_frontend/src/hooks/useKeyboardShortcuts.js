import { useEffect, useCallback, useRef } from 'react';

export function useKeyboardShortcuts(shortcuts, dependencies = []) {
  const shortcutsRef = useRef(shortcuts);
  
  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((event) => {
    const { key, ctrlKey, altKey, shiftKey, metaKey } = event;
    
    // Don't trigger shortcuts when typing in inputs
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    const shortcutKey = [
      ctrlKey && 'ctrl',
      altKey && 'alt', 
      shiftKey && 'shift',
      metaKey && 'meta',
      key.toLowerCase()
    ].filter(Boolean).join('+');

    const shortcut = shortcutsRef.current[shortcutKey];
    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

// Predefined shortcut combinations for teacher dashboard
export const TEACHER_SHORTCUTS = {
  // Navigation
  'ctrl+d': { description: 'Go to Dashboard', key: 'ctrl+d' },
  'ctrl+a': { description: 'Take Attendance', key: 'ctrl+a' },
  'ctrl+s': { description: 'View Students', key: 'ctrl+s' },
  'ctrl+h': { description: 'Attendance History', key: 'ctrl+h' },
  
  // Quick actions
  'ctrl+n': { description: 'New Attendance Session', key: 'ctrl+n' },
  'ctrl+e': { description: 'Edit Last Session', key: 'ctrl+e' },
  'ctrl+r': { description: 'Refresh Data', key: 'ctrl+r' },
  
  // Attendance marking (when in attendance page)
  'p': { description: 'Mark Present', key: 'p' },
  'l': { description: 'Mark Late', key: 'l' },
  'x': { description: 'Mark Absent', key: 'x' },
  
  // Bulk operations
  'ctrl+shift+p': { description: 'Mark All Present', key: 'ctrl+shift+p' },
  'ctrl+shift+a': { description: 'Mark All Absent', key: 'ctrl+shift+a' },
  
  // Search and filter
  '/': { description: 'Focus Search', key: '/' },
  'escape': { description: 'Clear Search/Close Modal', key: 'escape' },
  
  // Help
  'ctrl+?': { description: 'Show Shortcuts Help', key: 'ctrl+?' },
  'f1': { description: 'Show Help', key: 'f1' }
};

// Keyboard shortcuts help modal
export function KeyboardShortcutsHelp({ isOpen, onClose, shortcuts = TEACHER_SHORTCUTS }) {
  useKeyboardShortcuts({
    'escape': { action: onClose }
  });

  if (!isOpen) return null;

  const shortcutGroups = {
    'Navigation': ['ctrl+d', 'ctrl+a', 'ctrl+s', 'ctrl+h'],
    'Quick Actions': ['ctrl+n', 'ctrl+e', 'ctrl+r'],
    'Attendance Marking': ['p', 'l', 'x', 'ctrl+shift+p', 'ctrl+shift+a'],
    'Search & Filter': ['/', 'escape'],
    'Help': ['ctrl+?', 'f1']
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {Object.entries(shortcutGroups).map(([groupName, keys]) => (
            <div key={groupName}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3">{groupName}</h3>
              <div className="space-y-2">
                {keys.map(key => {
                  const shortcut = shortcuts[key];
                  if (!shortcut) return null;
                  
                  return (
                    <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-700">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-200 text-gray-800 text-sm rounded font-mono">
                        {key.split(+".map(k => k.charAt(0).toUpperCase() + k.slice(1)).join(' + ')}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> Shortcuts work when not typing in input fields. 
            Press <kbd className="px-1 py-0.5 bg-blue-200 rounded text-xs">Ctrl + ?</kbd> anytime to see this help.
          </p>
        </div>
      </div>
    </div>
  );
}