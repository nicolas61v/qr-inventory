'use client';

import { useRef, useEffect } from 'react';
import QRCode from 'qrcode';

interface QRGridProps {
  codes: string[]; // Ahora recibe array de 9 códigos
  onReady?: (dataUrl: string) => void;
}

export default function QRGrid({ codes, onReady }: QRGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const generateGrid = async () => {
      if (!canvasRef.current || codes.length === 0) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const size = 1080;
      canvas.width = size;
      canvas.height = size;

      // Fondo blanco
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, size, size);

      if (codes.length === 1) {
        // Reimpresión: QR pequeño (mismo tamaño que en grid) + texto indicando reimpresión
        const qrSize = 280;
        const x = (size - qrSize) / 2;
        const y = 80;

        const qrDataUrl = await QRCode.toDataURL(codes[0], {
          width: qrSize,
          margin: 1,
        });

        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => {
            // Título
            ctx.fillStyle = '#999';
            ctx.font = 'bold 32px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('REIMPRESION', size / 2, 50);

            // QR
            ctx.drawImage(img, x, y, qrSize, qrSize);

            // Código debajo del QR
            ctx.fillStyle = '#333';
            ctx.font = '24px monospace';
            ctx.fillText(codes[0].slice(0, 8), size / 2, y + qrSize + 35);

            // Línea divisoria
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(100, y + qrSize + 70);
            ctx.lineTo(size - 100, y + qrSize + 70);
            ctx.stroke();

            // Texto informativo en el espacio restante
            ctx.fillStyle = '#bbb';
            ctx.font = '28px sans-serif';
            ctx.fillText('Este QR ya existe en el sistema', size / 2, y + qrSize + 140);
            ctx.fillText('Recorta y pega sobre el anterior', size / 2, y + qrSize + 180);

            // Código completo abajo
            ctx.font = '18px monospace';
            ctx.fillStyle = '#ccc';
            ctx.fillText(codes[0], size / 2, size - 50);

            resolve();
          };
          img.src = qrDataUrl;
        });
      } else {
        // Grid de 3x3 con QRs únicos
        const qrSize = 280;
        const labelHeight = 30;
        const cellHeight = qrSize + labelHeight;
        const gap = (size - qrSize * 3) / 4;
        const vGap = (size - cellHeight * 3) / 4;

        for (let i = 0; i < 9 && i < codes.length; i++) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const x = gap + col * (qrSize + gap);
          const y = vGap + row * (cellHeight + vGap);

          const qrDataUrl = await QRCode.toDataURL(codes[i], {
            width: qrSize,
            margin: 1,
          });

          const img = new Image();
          await new Promise<void>((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, x, y, qrSize, qrSize);

              ctx.fillStyle = '#666';
              ctx.font = '18px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(codes[i].slice(0, 8), x + qrSize / 2, y + qrSize + 20);
              resolve();
            };
            img.src = qrDataUrl;
          });
        }
      }

      onReady?.(canvas.toDataURL('image/png'));
    };

    generateGrid();
  }, [codes, onReady]);

  return (
    <canvas
      ref={canvasRef}
      className="max-w-full h-auto border"
      style={{ maxWidth: '400px' }}
    />
  );
}
