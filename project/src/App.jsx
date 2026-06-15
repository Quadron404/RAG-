import { useState, useMemo, useRef, useEffect, useCallback } from 'react';

const PASSCODE = import.meta.env.VITE_PASSCODE || 'RAG2718';
const API_URL  = '/api/entries';

/* ── IST Clock ───────────────────────────────────────────────────────────── */

function useClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => {
      const s = new Date().toLocaleTimeString('en-IN', {
        timeZone:  'Asia/Kolkata',
        hour12:    false,
        hour:      '2-digit',
        minute:    '2-digit',
        second:    '2-digit',
      });
      setT(s + ' IST');
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/* ── Stars ───────────────────────────────────────────────────────────────── */

function Stars() {
  const stars = useMemo(() =>
    Array.from({ length: 170 }, (_, i) => ({
      id:      i,
      top:     Math.random() * 100,
      size:    Math.random() * 2.2 + 0.6,
      dur:     Math.random() * 14 + 7,
      delay:  -(Math.random() * 21),
      opacity: Math.random() * 0.5 + 0.12,
    })), []);

  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden',
      pointerEvents: 'none', zIndex: 10,
    }}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:     'absolute',
          top:          `${s.top}%`,
          left:         0,
          width:        `${s.size}px`,
          height:       `${s.size}px`,
          borderRadius: '50%',
          background:   '#fff',
          opacity:      s.opacity,
          animation:    `starDrift ${s.dur}s linear ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

/* ── ASCII Upload Animation ──────────────────────────────────────────────── */

const BAR_FRAMES = [
  '[          ] 0%  uploading',
  '[==        ] 20% uploading',
  '[====      ] 40% uploading',
  '[======    ] 60% uploading',
  '[========  ] 80% uploading',
  '[==========] 99% uploading',
];

function AsciiProgress() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % BAR_FRAMES.length), 280);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ color: '#aaa', fontFamily: "'Courier New',monospace", fontSize: 12 }}>
      {BAR_FRAMES[frame]}
    </span>
  );
}

/* ── Passcode Modal ──────────────────────────────────────────────────────── */

function PasscodeModal({ onSuccess }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef          = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const attempt = useCallback(() => {
    if (input === PASSCODE) {
      onSuccess();
    } else {
      setError('Wrong passcode. Try again.');
      setShake(true);
      setInput('');
      setTimeout(() => { setShake(false); setError(''); inputRef.current?.focus(); }, 1400);
    }
  }, [input, onSuccess]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, fontFamily: "'Courier New',monospace",
    }}>
      <div style={{
        border: '1px solid #333',
        padding: 'clamp(28px,6vw,44px) clamp(24px,8vw,52px)',
        width: 'min(380px,92vw)',
        background: '#000',
        animation: shake ? 'errShake 0.45s ease' : 'fadeIn 0.2s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 13, letterSpacing: 6, color: '#fff' }}>
            ENTER PASSCODE
          </div>
        </div>

        <input
          ref={inputRef}
          type="password"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && attempt()}
          style={{
            width: '100%', background: 'transparent',
            border: 'none', borderBottom: '1px solid #444',
            color: '#fff', fontFamily: "'Courier New',monospace",
            fontSize: 'clamp(15px,4vw,18px)',
            letterSpacing: 10, padding: '10px 0',
            outline: 'none', caretColor: '#fff',
            marginBottom: 8, textAlign: 'center', display: 'block',
          }}
          placeholder="········"
          autoComplete="off"
        />

        {error && (
          <div style={{ color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 12, letterSpacing: 1 }}>
            {error}
          </div>
        )}
        {!error && <div style={{ height: 28 }} />}

        <button onClick={attempt} style={{
          width: '100%', background: 'transparent',
          border: '1px solid #555', color: '#fff',
          fontFamily: "'Courier New',monospace",
          fontSize: 11, letterSpacing: 6, padding: '13px',
          cursor: 'pointer', transition: 'border-color 0.15s',
          minHeight: 48,
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; }}
        >
          ENTER
        </button>
      </div>
    </div>
  );
}

/* ── CLI Modal ───────────────────────────────────────────────────────────── */

function CliModal({ onClose }) {
  const [history, setHistory] = useState([]);
  const [input,   setInput]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const inputRef  = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  const submit = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setInput('');
    const idx = history.length;
    setHistory(h => [...h, { text, status: 'uploading' }]);

    try {
      const res  = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Failed');
      setHistory(h => h.map((e, i) => i === idx ? { ...e, status: 'ok' } : e));
    } catch {
      setHistory(h => h.map((e, i) => i === idx ? { ...e, status: 'err' } : e));
    } finally {
      setBusy(false);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [input, busy, history.length]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, fontFamily: "'Courier New',monospace",
      padding: 'clamp(8px,3vw,20px)',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{
        background: '#000', border: '1px solid #333',
        width: '100%', maxWidth: 800,
        height: 'min(540px,90dvh)',
        display: 'flex', flexDirection: 'column',
        animation: 'fadeIn 0.15s ease',
      }}>

        {/* title bar */}
        <div style={{
          borderBottom: '1px solid #222',
          padding: '7px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, letterSpacing: 1, color: '#444' }}>
            C:\RAG-Genesis\cmd.exe
          </span>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: '#444', fontSize: 14, cursor: 'pointer',
            padding: '0 4px', lineHeight: 1, minWidth: 28, minHeight: 28,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#444'; }}
          >×</button>
        </div>

        {/* terminal body */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: 'clamp(12px,3vw,18px)',
          fontSize: 'clamp(11px,2.8vw,13px)', lineHeight: 1.8,
          cursor: 'text',
        }} onClick={() => inputRef.current?.focus()}>

          <div style={{ color: '#fff', marginBottom: 16 }}>
            RAG-Genesis [Version 2.7182.8]
          </div>

          {history.map((entry, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              <div>
                <span style={{ color: '#666' }}>C:\RAG-Genesis&gt;&nbsp;</span>
                <span style={{ color: '#fff' }}>{entry.text}</span>
              </div>

              {entry.status === 'uploading' && (
                <div style={{ marginLeft: 2 }}>
                  <AsciiProgress />
                </div>
              )}

              {entry.status === 'ok' && (
                <div style={{ color: '#00cc44', marginLeft: 2, fontSize: 12 }}>
                  [==========] 100% done — data stored successfully.
                </div>
              )}

              {entry.status === 'err' && (
                <div style={{ color: '#888', marginLeft: 2, fontSize: 12 }}>
                  [!!] Storage failed. Check connection and retry.
                </div>
              )}
            </div>
          ))}

          {/* active prompt */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ color: '#666', flexShrink: 0 }}>C:\RAG-Genesis&gt;&nbsp;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') onClose(); }}
              disabled={busy}
              style={{
                background: 'transparent', border: 'none', color: '#fff',
                fontFamily: "'Courier New',monospace",
                fontSize: 'clamp(11px,2.8vw,13px)',
                outline: 'none', caretColor: '#fff',
                flex: 1, minWidth: 40,
              }}
              autoComplete="off" spellCheck={false}
            />
          </div>
          <div ref={bottomRef} />
        </div>

        {/* bottom action bar */}
        <div style={{
          borderTop: '1px solid #1a1a1a',
          padding: '8px clamp(12px,3vw,18px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: 2 }}>
            {busy ? 'UPLOADING...' : 'READY'}
          </span>
          <button onClick={submit} disabled={busy} style={{
            background: 'transparent', border: '1px solid #555',
            color: '#fff', fontFamily: "'Courier New',monospace",
            fontSize: 10, letterSpacing: 5,
            padding: '8px clamp(16px,4vw,24px)',
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0.35 : 1,
            transition: 'border-color 0.15s',
            minHeight: 36,
          }}
            onMouseEnter={e => { if (!busy) e.currentTarget.style.borderColor = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#555'; }}
          >
            ENTER
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */

function MainPage() {
  const [cliOpen, setCliOpen] = useState(false);
  const clock = useClock();

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', background: '#000',
    }}>
      {/* Logo — z-index 5, stars at z-index 10 pass above it */}
      <div style={{
        position: 'relative', zIndex: 5,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 'clamp(24px,5vh,44px)',
        transform: 'translateY(-20px)',
        padding: '0 16px',
      }}>
        <img
          src="/ChatGPT_Image_Jun_15,_2026,_03_04_08_PM.png"
          alt="RAG – Neural Net-Based Artificial Intelligence"
          style={{
            width: 'clamp(240px,52vw,500px)',
            height: 'auto',
            display: 'block',
            mixBlendMode: 'screen',
          }}
        />

        <button
          onClick={() => setCliOpen(true)}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.55)',
            color: '#fff',
            fontFamily: "'Courier New',monospace",
            fontSize: 'clamp(9px,2.2vw,11px)',
            letterSpacing: 8,
            padding: 'clamp(12px,3vw,15px) clamp(28px,8vw,52px)',
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            minHeight: 48, minWidth: 160,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#fff'; }}
        >
          ENTER DATA
        </button>
      </div>

      {/* Stars drift ABOVE the logo */}
      <Stars />

      {/* Footer */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px clamp(16px,4vw,28px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        zIndex: 20, fontFamily: "'Courier New',monospace",
      }}>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, letterSpacing: 6, color: '#555', flex: 1, textAlign: 'center' }}>
          RAG-Genesis
        </span>
        <span style={{ fontSize: 10, letterSpacing: 1, color: '#444', flex: 1, textAlign: 'right', minWidth: 0 }}>
          {clock}
        </span>
      </div>

      {cliOpen && <CliModal onClose={() => setCliOpen(false)} />}
    </div>
  );
}

/* ── App ─────────────────────────────────────────────────────────────────── */

export default function App() {
  const [authed, setAuthed] = useState(false);
  return authed
    ? <MainPage />
    : <PasscodeModal onSuccess={() => setAuthed(true)} />;
}
