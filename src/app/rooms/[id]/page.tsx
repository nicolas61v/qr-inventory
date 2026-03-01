'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import QRScanner from '@/components/QRScanner';

interface QRItem {
  id: string;
  code: string | null;
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

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newQuality, setNewQuality] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [saving, setSaving] = useState(false);

  // Link QR state
  const [linkingItemId, setLinkingItemId] = useState<string | null>(null);
  const [linkError, setLinkError] = useState('');

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
        code: doc.data().code ?? null,
        itemName: doc.data().itemName,
        quality: doc.data().quality ?? 5,
        comment: doc.data().comment ?? null,
      }));
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId]);

  const handleAddItem = async () => {
    if (!newItemName.trim()) return;

    setSaving(true);
    try {
      await addDoc(collection(db, 'qrcodes'), {
        code: null,
        roomId: roomId,
        itemName: newItemName.trim(),
        quality: newQuality,
        comment: newComment.trim() || null,
        createdAt: serverTimestamp(),
      });
      setNewItemName('');
      setNewQuality(5);
      setNewComment('');
      setShowForm(false);
    } catch (error) {
      console.error('Error agregando item:', error);
      alert('Error al agregar item');
    } finally {
      setSaving(false);
    }
  };

  const handleLinkQR = async (scannedCode: string) => {
    if (!linkingItemId) return;

    setLinkError('');

    try {
      // Check if this QR code already exists in another document
      const existingQuery = query(
        collection(db, 'qrcodes'),
        where('code', '==', scannedCode)
      );
      const existingDocs = await getDocs(existingQuery);

      if (!existingDocs.empty) {
        setLinkError('Este QR ya esta vinculado a otro item. Usa un QR diferente.');
        setLinkingItemId(null);
        return;
      }

      // Update the item with the scanned QR code
      await updateDoc(doc(db, 'qrcodes', linkingItemId), {
        code: scannedCode,
      });

      setLinkingItemId(null);
    } catch (error) {
      console.error('Error vinculando QR:', error);
      setLinkError('Error al vincular el QR');
      setLinkingItemId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/rooms" className="text-blue-600 hover:underline">
          Habitaciones
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold">{roomName || 'Cargando...'}</h1>
      </div>

      {/* Add item button / form */}
      <div className="bg-white p-4 rounded-lg shadow">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors font-medium"
          >
            + Agregar item sin QR
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Nuevo item</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Nombre del item
              </label>
              <input
                type="text"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                placeholder="ej: Laptop Dell, Silla azul, etc."
                className="w-full px-3 py-2 border rounded"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Estado / Calidad
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewQuality(star)}
                    className={`text-2xl transition-colors ${
                      star <= newQuality ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-xs text-gray-500 ml-2">
                  {newQuality === 1 && 'Malo'}
                  {newQuality === 2 && 'Regular'}
                  {newQuality === 3 && 'Aceptable'}
                  {newQuality === 4 && 'Bueno'}
                  {newQuality === 5 && 'Excelente'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Comentario (opcional)
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Notas adicionales..."
                rows={2}
                className="w-full px-3 py-2 border rounded resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                disabled={saving || !newItemName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Agregar'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Link QR scanner overlay */}
      {linkingItemId && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-4 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Vincular QR</h2>
              <button
                onClick={() => setLinkingItemId(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Escanea el codigo QR fisico para vincularlo a este item.
            </p>
            <QRScanner onScan={handleLinkQR} />
          </div>
        </div>
      )}

      {/* Error message */}
      {linkError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {linkError}
          <button
            onClick={() => setLinkError('')}
            className="ml-2 text-red-500 hover:text-red-700 font-medium"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Items list */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">
          Items en esta habitacion
          {!loading && items.length > 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({items.length})
            </span>
          )}
        </h2>

        {loading ? (
          <p className="text-gray-500">Cargando...</p>
        ) : items.length === 0 ? (
          <p className="text-gray-500">
            No hay items. Usa el boton de arriba para agregar items, o escanea un QR y asignalo a esta habitacion.
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

                    {/* QR status */}
                    {item.code ? (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        {item.code.slice(0, 8)}...
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          Sin QR
                        </span>
                        <button
                          onClick={() => setLinkingItemId(item.id)}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full hover:bg-blue-100 font-medium transition-colors"
                        >
                          Vincular QR
                        </button>
                      </div>
                    )}
                  </div>

                  {item.code ? (
                    <Link
                      href={`/qr/${item.code}`}
                      className="text-blue-600 hover:underline text-sm shrink-0"
                    >
                      Editar
                    </Link>
                  ) : (
                    <Link
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setLinkingItemId(item.id);
                      }}
                      className="text-blue-600 hover:underline text-sm shrink-0"
                    >
                      Vincular
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
