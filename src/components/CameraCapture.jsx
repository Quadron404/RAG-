import { useRef, useEffect, useState, useCallback } from 'react';

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [facing, setFacing] = useState('environment');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode) => {
    stopStream();
    setReady(false);
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setReady(true);
    } catch {
      setError('Camera access denied or unavailable.');
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera(facing);
    return stopStream;
  }, [facing, startCamera, stopStream]);

  const flip = () => setFacing(f => f === 'environment' ? 'user' : 'environment');

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready) return;
    const canvas = document.createElement('canvas');
    const maxSide = 1280;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxSide || h > maxSide) {
      const scale = maxSide / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (facing === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(blob => {
      stopStream();
      onCapture?.(blob);
    }, 'image/jpeg', 0.88);
  };

  return (
    <div className="rag-cam">
      <div className="rag-cam-header">
        <button type="button" className="rag-cam-cancel" onClick={onClose}>Cancel</button>
        <span className="rag-cam-title">RAG Image Analysis</span>
        <div style={{ width: 56 }} />
      </div>

      <div className="rag-cam-preview-wrap">
        {error ? (
          <div className="rag-cam-error">{error}</div>
        ) : (
          <video ref={videoRef} className="rag-cam-video" playsInline muted />
        )}
      </div>

      <div className="rag-cam-controls">
        <button type="button" className="rag-cam-flip" onClick={flip} aria-label="Flip camera">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 7h12a4 4 0 0 1 0 8H9" />
            <path d="M7 11l-4-4 4-4" />
            <path d="M21 17H9a4 4 0 0 1 0-8h6" />
            <path d="M17 13l4 4-4 4" />
          </svg>
        </button>

        <button type="button" className="rag-cam-shutter" onClick={capture} disabled={!ready} aria-label="Capture">
          <span className="rag-cam-shutter-ring" />
        </button>

        <div style={{ width: 48 }} />
      </div>
    </div>
  );
}
