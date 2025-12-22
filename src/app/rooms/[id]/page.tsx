'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

interface QRItem {
  id: string;
  code: string;
  itemName: string | null;
  quality: number;
  comment: string | null;
}

export default function RoomDetailPage() {
  const params = useParams();
  const roomId = params.id as string;

  const [roomName, setRoomName] = useState('');
  const [items, setItems] = useState<QRItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRoom = async () => {
      const roomDoc = await getDoc(doc(db, 'rooms', roomId));
      if (roomDoc.exists()) {
        setRoomName(roomDoc.data().name);
      }
    };
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    const q = query(
      collection(db, 'qrcodes'),
      where('roomId', '==', roomId)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        code: doc.data().code,
        itemName: doc.data().itemName,
        quality: doc.data().quality ?? 5,
        comment: doc.data().comment ?? null,
      }));
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/rooms" className="text-blue-600 hover:underline">
          Habitaciones
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold">{roomName || 'Cargando...'}</h1>
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Items en esta habitacion</h2>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">
            No hay items. Escanea un QR y asignalo a esta habitacion.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50 rounded border-l-4"
                style={{
                  borderLeftColor: item.quality >= 4 ? '#22c55e' : item.quality >= 3 ? '#eab308' : '#ef4444'
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">
                      {item.itemName || 'Sin nombre'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-sm ${
                              star <= item.quality ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {item.quality === 1 && 'Malo'}
                        {item.quality === 2 && 'Regular'}
                        {item.quality === 3 && 'Aceptable'}
                        {item.quality === 4 && 'Bueno'}
                        {item.quality === 5 && 'Excelente'}
                      </span>
                    </div>
                    {item.comment && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        &quot;{item.comment}&quot;
                      </p>
                    )}
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      {item.code.slice(0, 8)}...
                    </p>
                  </div>
                  <Link
                    href={`/qr/${item.code}`}
                    className="text-blue-600 hover:underline text-sm shrink-0"
                  >
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
