'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  code: string;
  size?: number;
}

export default function QRGenerator({ code, size = 200 }: QRGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && code) {
      QRCode.toCanvas(canvasRef.current, code, {
        width: size,
        margin: 2,
      });
    }
  }, [code, size]);

  return <canvas ref={canvasRef} />;
}
