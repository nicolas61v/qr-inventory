'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface QRScannerProps {
  onScan: (code: string) => void;
}

interface CameraCapabilities {
  zoom?: { min: number; max: number; step: number };
  torch?: boolean;
}

export default function QRScanner({ onScan }: QRScannerProps) {
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [flashOn, setFlashOn] = useState(false);
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);

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

      // Obtener el track de video para controlar zoom y flash
      setTimeout(() => {
        const videoElement = document.querySelector('#qr-reader video') as HTMLVideoElement;
        if (videoElement && videoElement.srcObject) {
          const stream = videoElement.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0];
          trackRef.current = track;

          // Obtener capacidades del dispositivo
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const caps = track.getCapabilities() as any;
          const newCapabilities: CameraCapabilities = {};

          if (caps.zoom) {
            newCapabilities.zoom = {
              min: caps.zoom.min,
              max: caps.zoom.max,
              step: caps.zoom.step || 0.1,
            };
            setZoom(caps.zoom.min);
          }

          if (caps.torch !== undefined) {
            newCapabilities.torch = true;
          }

          setCapabilities(newCapabilities);
        }
      }, 500);
    } catch (err) {
      console.error('Error iniciando scanner:', err);
      setError('No se pudo acceder a la camara. Verifica los permisos.');
    }
  };

  const handleZoom = async (newZoom: number) => {
    if (!trackRef.current || !capabilities.zoom) return;

    const clampedZoom = Math.max(
      capabilities.zoom.min,
      Math.min(capabilities.zoom.max, newZoom)
    );

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (trackRef.current as any).applyConstraints({
        advanced: [{ zoom: clampedZoom }],
      });
      setZoom(clampedZoom);
    } catch (err) {
      console.error('Error aplicando zoom:', err);
    }
  };

  const toggleFlash = async () => {
    if (!trackRef.current || !capabilities.torch) return;

    try {
      const newFlashState = !flashOn;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (trackRef.current as any).applyConstraints({
        advanced: [{ torch: newFlashState }],
      });
      setFlashOn(newFlashState);
    } catch (err) {
      console.error('Error toggling flash:', err);
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
    trackRef.current = null;
    setScanning(false);
    setFlashOn(false);
    setZoom(1);
    setCapabilities({});
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

      {/* Controles de zoom y flash */}
      {scanning && (capabilities.zoom || capabilities.torch) && (
        <div className="flex flex-col gap-3 p-3 bg-gray-100 rounded-lg max-w-md mx-auto">
          {/* Control de Zoom */}
          {capabilities.zoom && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-12">Zoom</span>
              <button
                onClick={() => handleZoom(zoom - capabilities.zoom!.step * 2)}
                className="w-10 h-10 bg-white rounded-full shadow text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              >
                -
              </button>
              <input
                type="range"
                min={capabilities.zoom.min}
                max={capabilities.zoom.max}
                step={capabilities.zoom.step}
                value={zoom}
                onChange={(e) => handleZoom(parseFloat(e.target.value))}
                className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
              />
              <button
                onClick={() => handleZoom(zoom + capabilities.zoom!.step * 2)}
                className="w-10 h-10 bg-white rounded-full shadow text-xl font-bold text-gray-700 hover:bg-gray-50 active:bg-gray-100"
              >
                +
              </button>
              <span className="text-xs text-gray-500 w-10">{zoom.toFixed(1)}x</span>
            </div>
          )}

          {/* Control de Flash */}
          {capabilities.torch && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700 w-12">Flash</span>
              <button
                onClick={toggleFlash}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  flashOn
                    ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500'
                    : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                }`}
              >
                <span className="text-lg">{flashOn ? '💡' : '🔦'}</span>
                {flashOn ? 'Encendido' : 'Apagado'}
              </button>
            </div>
          )}
        </div>
      )}

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
