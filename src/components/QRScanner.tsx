'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (code: string) => void;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanner = async () => {
    if (scanning || !containerRef.current) return;

    try {
      setError('');
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText);
          stopScanner();
        },
        () => {
          // Ignorar errores de escaneo (frames sin QR)
        }
      );
      setScanning(true);
    } catch (err) {
      console.error('Error iniciando scanner:', err);
      setError('No se pudo acceder a la camara. Verifica los permisos.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error('Error deteniendo scanner:', err);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        ref={containerRef}
        className="w-full max-w-md mx-auto bg-black rounded overflow-hidden"
        style={{ minHeight: scanning ? '300px' : '0' }}
      />

      {error && (
        <p className="text-red-600 text-sm">{error}</p>
      )}

      <div className="flex gap-2">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Iniciar Camara
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Detener Camara
          </button>
        )}
      </div>
    </div>
  );
}
