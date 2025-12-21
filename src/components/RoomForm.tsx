'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function RoomForm({ onCreated }: { onCreated?: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'rooms'), {
        name: name.trim(),
        createdAt: serverTimestamp(),
      });
      setName('');
      onCreated?.();
    } catch (error) {
      console.error('Error creando habitacion:', error);
      alert('Error al crear la habitacion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre de la habitacion"
        className="flex-1 px-3 py-2 border rounded"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creando...' : 'Crear'}
      </button>
    </form>
  );
}
