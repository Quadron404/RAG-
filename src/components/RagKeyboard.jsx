import { useState, useCallback } from 'react';

const ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['⇧', 'z', 'x', 'c', 'v', 'b', 'n', 'm', '⌫'],
];

const NUM_ROW = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export default function RagKeyboard({ onKey, onBackspace, onEnter, onClose }) {
  const [shift, setShift] = useState(false);
  const [nums, setNums] = useState(false);

  const press = useCallback((key) => {
    if (key === '⇧') { setShift(s => !s); return; }
    if (key === '⌫') { onBackspace?.(); return; }
    const out = shift && key.length === 1 ? key.toUpperCase() : key;
    onKey?.(out);
    if (shift) setShift(false);
  }, [shift, onKey, onBackspace]);

  const displayRows = nums
    ? [NUM_ROW, ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'], ['#+=', '.', ',', '?', '!', "'", '⌫']]
    : ROWS;

  return (
    <div className="rag-kb" onMouseDown={e => e.preventDefault()}>
      <div className="rag-kb-keys">
        {displayRows.map((row, ri) => (
          <div key={ri} className="rag-kb-row" style={ri === 1 && !nums ? { paddingLeft: 14 } : undefined}>
            {row.map((key) => (
              <button
                key={key}
                type="button"
                className={`rag-kb-key${key === '⇧' && shift ? ' rag-kb-key--active' : ''}${key === '⌫' || key === '⇧' || key === '#+=' ? ' rag-kb-key--wide' : ''}`}
                onClick={() => {
                  if (key === '#+=') { setNums(false); return; }
                  press(key);
                }}
              >
                {key === '⇧' && shift ? '⇪' : key}
              </button>
            ))}
          </div>
        ))}

        <div className="rag-kb-row rag-kb-row--bottom">
          <button type="button" className="rag-kb-key rag-kb-key--fn" onClick={() => setNums(n => !n)}>
            {nums ? 'ABC' : '123'}
          </button>
          <button type="button" className="rag-kb-key rag-kb-key--space" onClick={() => onKey?.(' ')}>
            space
          </button>
          <button type="button" className="rag-kb-key rag-kb-key--fn" onClick={() => onEnter?.()}>
            return
          </button>
        </div>
      </div>

      <div className="rag-kb-footer">
        <span>RAG-keyboard</span>
        {onClose && (
          <button type="button" className="rag-kb-dismiss" onClick={onClose}>▼</button>
        )}
      </div>
    </div>
  );
}
