'use client';

import { useEffect, useState } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import RoomForm from '@/components/RoomForm';
import Link from 'next/link';

interface Room {
  id: string;
  name: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
                className="font-medium hover:text-blue-600"
              >
                {room.name}
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
