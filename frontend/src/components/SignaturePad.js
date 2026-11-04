import React, { useCallback, useEffect, useRef, useState } from 'react';
import './SignaturePad.css';

const SignaturePad = ({ onChange }) => {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasInkRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const emit = (ink, dataUrl) => {
    if (onChangeRef.current) onChangeRef.current({ hasInk: ink, dataUrl });
  };

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.floor(rect.width);
    const h = Math.floor(rect.height);
    if (w < 10 || h < 10) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    hasInkRef.current = false;
    setHasInk(false);
    emit(false, '');
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => initCanvas(), 50);
    const onResize = () => initCanvas();
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [initCanvas]);

  const pos = (e) => {
    const canvas = canvasRef.current;
    const r = canvas.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX;
    const clientY = e.clientY ?? e.touches?.[0]?.clientY;
    return { x: clientX - r.left, y: clientY - r.top };
  };

  const start = (e) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {
      /* ignore */
    }
    drawing.current = true;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!hasInkRef.current) {
      hasInkRef.current = true;
      setHasInk(true);
    }
  };

  const end = (e) => {
    if (e) {
      e.preventDefault();
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }
    }
    drawing.current = false;
    if (hasInkRef.current && canvasRef.current) {
      emit(true, canvasRef.current.toDataURL('image/png'));
    }
  };

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        className="signature-pad-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="signature-pad-actions">
        <button type="button" className="btn btn-secondary" onClick={initCanvas}>
          Effacer
        </button>
        <small>{hasInk ? 'Signature enregistrée' : 'Signez dans le cadre'}</small>
      </div>
    </div>
  );
};

export default SignaturePad;
