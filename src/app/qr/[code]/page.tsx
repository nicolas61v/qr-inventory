'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import QRGenerator from '@/components/QRGenerator';

interface QRData {
  id: string;
  code: string;
  roomId: string | null;
  itemName: string | null;
}

interface Room {
  id: string;
  name: string;
}

export default function QRInfoPage() {
  const params = useParams();
  const code = params.code as string;

  const [qrData, setQrData] = useState<QRData | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [itemName, setItemName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [roomName, setRoomName] = useState('');

  // Cargar datos del QR
  useEffect(() => {
    const fetchQR = async () => {
      const q = query(collection(db, 'qrcodes'), where('code', '==', code));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const docData = snapshot.docs[0];
      const data = docData.data();
      setQrData({
        id: docData.id,
        code: data.code,
        roomId: data.roomId,
        itemName: data.itemName,
      });
      setSelectedRoom(data.roomId || '');
      setItemName(data.itemName || '');

      // Si tiene habitacion, obtener el nombre
      if (data.roomId) {
        const roomDoc = await getDocs(
          query(collection(db, 'rooms'), where('__name__', '==', data.roomId))
        );
        if (!roomDoc.empty) {
          setRoomName(roomDoc.docs[0].data().name);
        }
      }

      setLoading(false);
    };

    fetchQR();
  }, [code]);

  // Cargar lista de habitaciones
  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setRooms(roomsData);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!qrData) return;

    setSaving(true);
    try {
      await updateDoc(doc(db, 'qrcodes', qrData.id), {
        roomId: selectedRoom || null,
        itemName: itemName.trim() || null,
      });

      // Actualizar nombre de habitacion local
      if (selectedRoom) {
        const room = rooms.find((r) => r.id === selectedRoom);
        setRoomName(room?.name || '');
      } else {
        setRoomName('');
      }

      setQrData({
        ...qrData,
        roomId: selectedRoom || null,
        itemName: itemName.trim() || null,
      });

      alert('Guardado correctamente');
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-red-600">QR No Encontrado</h1>
        <p className="text-gray-600">
          Este codigo QR no esta registrado en el sistema.
        </p>
        <p className="text-xs text-gray-400 font-mono">{code}</p>
        <Link href="/qr" className="text-blue-600 hover:underline">
          Crear nuevo QR
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Informacion del QR</h1>

      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4 flex-wrap">
          <QRGenerator code={code} size={120} />
          <div>
            <p className="text-xs text-gray-500 font-mono mb-2">
              {code}
            </p>
            {qrData?.roomId && (
              <p className="text-sm">
                <span className="text-gray-600">Habitacion:</span>{' '}
                <Link
                  href={`/rooms/${qrData.roomId}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {roomName}
                </Link>
              </p>
            )}
            {qrData?.itemName && (
              <p className="text-sm">
                <span className="text-gray-600">Item:</span>{' '}
                <span className="font-medium">{qrData.itemName}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h2 className="font-semibold">Asignar / Editar</h2>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Habitacion
          </label>
          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Sin asignar</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Nombre del item
          </label>
          <input
            type="text"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="ej: Laptop Dell, Silla azul, etc."
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  );
}
