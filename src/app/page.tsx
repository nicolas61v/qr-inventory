'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface QRItem {
  id: string;
  code: string;
  itemName: string | null;
  roomId: string | null;
  quality: number;
  comment: string | null;
}

interface Room {
  id: string;
  name: string;
}

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<QRItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar items y habitaciones
  useEffect(() => {
    const unsubItems = onSnapshot(
      query(collection(db, 'qrcodes'), orderBy('itemName')),
      (snapshot) => {
        const itemsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          code: doc.data().code,
          itemName: doc.data().itemName,
          roomId: doc.data().roomId,
          quality: doc.data().quality ?? 5,
          comment: doc.data().comment ?? null,
        }));
        setItems(itemsData);
        setLoading(false);
      }
    );

    const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
      const roomsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name,
      }));
      setRooms(roomsData);
    });

    return () => {
      unsubItems();
      unsubRooms();
    };
  }, []);

  // Filtrar items por búsqueda
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const term = searchTerm.toLowerCase().trim();
    return items.filter(
      (item) =>
        item.itemName?.toLowerCase().includes(term) ||
        item.comment?.toLowerCase().includes(term)
    );
  }, [items, searchTerm]);

  // Agrupar items por nombre similar
  const groupedItems = useMemo(() => {
    const groups: { [key: string]: QRItem[] } = {};

    filteredItems.forEach((item) => {
      const key = item.itemName?.toLowerCase() || 'sin nombre';
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
  }, [filteredItems]);

  // Obtener nombre de habitación
  const getRoomName = (roomId: string | null) => {
    if (!roomId) return 'Sin asignar';
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || 'Desconocida';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistema de Inventario QR</h1>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Buscar Items
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nombre... ej: teclado, monitor, silla"
          className="w-full px-4 py-3 border rounded-lg text-lg"
          autoComplete="off"
        />
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            {loading
              ? 'Cargando...'
              : `${filteredItems.length} item(s) encontrado(s)`}
          </p>
        )}
      </div>

      {/* Resultados de búsqueda */}
      {searchTerm && filteredItems.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-3">Resultados</h2>

          {groupedItems.map(([name, groupItems]) => (
            <div key={name} className="mb-4 last:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium capitalize">{name}</span>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {groupItems.length} unidad(es)
                </span>
              </div>

              <div className="space-y-2 pl-2 border-l-2 border-gray-200">
                {groupItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/rooms/${item.roomId}`}
                          className={`font-medium ${
                            item.roomId
                              ? 'text-blue-600 hover:underline'
                              : 'text-orange-600'
                          }`}
                        >
                          {getRoomName(item.roomId)}
                        </Link>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`text-xs ${
                                star <= item.quality
                                  ? 'text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {item.comment && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.comment}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/qr/${item.code}`}
                      className="text-blue-600 hover:underline text-xs shrink-0 ml-2"
                    >
                      Ver
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Accesos rápidos */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/rooms"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Habitaciones</h2>
          <p className="text-gray-600 text-sm">
            Gestiona tus habitaciones y ve los items de cada una
          </p>
        </Link>

        <Link
          href="/qr"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Crear QR</h2>
          <p className="text-gray-600 text-sm">
            Genera codigos QR y descarga para imprimir
          </p>
        </Link>

        <Link
          href="/scan"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <h2 className="text-lg font-semibold mb-2">Escanear</h2>
          <p className="text-gray-600 text-sm">
            Usa la camara para leer un codigo QR
          </p>
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      {!loading && items.length > 0 && (
        <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-600">
          <p>
            Total: <strong>{items.length}</strong> QRs registrados |{' '}
            <strong>{items.filter((i) => i.itemName).length}</strong> con nombre
            asignado |{' '}
            <strong>{items.filter((i) => i.roomId).length}</strong> en
            habitaciones
          </p>
        </div>
      )}
    </div>
  );
}
