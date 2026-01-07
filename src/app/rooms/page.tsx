'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RoomForm from '@/components/RoomForm';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
}

type ItemCountCache = Record<string, number>;

const CACHE_KEY = 'roomItemCounts';

function loadCacheFromStorage(): ItemCountCache {
  if (typeof window === 'undefined') return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch {
    return {};
  }
}

function saveCacheToStorage(counts: ItemCountCache) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(counts));
  } catch {
    // localStorage lleno o no disponible
  }
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemCounts, setItemCounts] = useState<ItemCountCache>(loadCacheFromStorage);

  // Listener para habitaciones
  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setRooms(roomsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Listener para conteo de items (con caché)
  useEffect(() => {
    const q = query(collection(db, 'qrcodes'), where('roomId', '!=', null));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counts: ItemCountCache = {};
      snapshot.docs.forEach((doc) => {
        const roomId = doc.data().roomId;
        if (roomId) {
          counts[roomId] = (counts[roomId] || 0) + 1;
        }
      });
      setItemCounts(counts);
      saveCacheToStorage(counts);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminar habitacion "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'rooms', id));
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Habitaciones</h1>

      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Nueva Habitacion</h2>
        <RoomForm />
      </div>

      {loading ? (
        <p className="text-gray-500">Cargando...</p>
      ) : rooms.length === 0 ? (
        <p className="text-gray-500">No hay habitaciones. Crea una arriba.</p>
      ) : (
        <div className="space-y-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between bg-white p-4 rounded-lg shadow"
            >
              <Link
                href={`/rooms/${room.id}`}
                className="font-medium hover:text-blue-600 flex items-center gap-3"
              >
                {room.name}
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  {itemCounts[room.id] || 0} items
                </span>
              </Link>
              <button
                onClick={() => handleDelete(room.id, room.name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
