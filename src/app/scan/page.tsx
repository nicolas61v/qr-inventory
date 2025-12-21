'use client';

import { useRouter } from 'next/navigation';
import QRScanner from '@/components/QRScanner';

export default function ScanPage() {
  const router = useRouter();

  const handleScan = (code: string) => {
    // Redirigir a la pagina de info del QR
    router.push(`/qr/${code}`);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Escanear QR</h1>

      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600 mb-4">
          Apunta la camara al codigo QR del item
        </p>
        <QRScanner onScan={handleScan} />
      </div>
    </div>
  );
}
