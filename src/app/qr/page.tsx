'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import QRGenerator from '@/components/QRGenerator';
import QRGrid from '@/components/QRGrid';
import Link from 'next/link';

interface SavedQR {
  id: string;
  code: string;
  roomId: string | null;
  roomName: string | null;
  itemName: string | null;
}

export default function CreateQRPage() {
  const [codes, setCodes] = useState<string[]>([]);
  const [gridDataUrl, setGridDataUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedQRs, setSavedQRs] = useState<SavedQR[]>([]);
  const [loadingQRs, setLoadingQRs] = useState(true);
  const [selectedQR, setSelectedQR] = useState<SavedQR | null>(null);

  // Cargar QRs guardados
  useEffect(() => {
    const q = query(collection(db, 'qrcodes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const qrsData: SavedQR[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        let roomName = null;

        if (data.roomId) {
          const roomDoc = await getDoc(doc(db, 'rooms', data.roomId));
          if (roomDoc.exists()) {
            roomName = roomDoc.data().name;
          }
        }

        qrsData.push({
          id: docSnap.id,
          code: data.code,
          roomId: data.roomId,
          roomName,
          itemName: data.itemName,
        });
      }

      setSavedQRs(qrsData);
      setLoadingQRs(false);
    });

    return () => unsubscribe();
  }, []);

  const generateNewQRs = () => {
    // Genera 9 códigos únicos
    const newCodes = Array.from({ length: 9 }, () => uuidv4());
    setCodes(newCodes);
    setGridDataUrl('');
    setSaved(false);
    setSelectedQR(null);
  };

  const selectExistingQR = (qr: SavedQR) => {
    setCodes([qr.code]); // Solo 1 código para reimprimir
    setGridDataUrl('');
    setSaved(true);
    setSelectedQR(qr);
  };

  const saveToFirestore = async () => {
    if (codes.length === 0 || saved) return;

    setSaving(true);
    try {
      // Guardar todos los códigos
      for (const code of codes) {
        await addDoc(collection(db, 'qrcodes'), {
          code,
          roomId: null,
          itemName: null,
          createdAt: serverTimestamp(),
        });
      }
      setSaved(true);
    } catch (error) {
      console.error('Error guardando QRs:', error);
      alert('Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const downloadGrid = () => {
    if (!gridDataUrl) return;

    const link = document.createElement('a');
    const prefix = codes.length === 1 ? codes[0].slice(0, 8) : 'batch';
    link.download = `qr-${prefix}.png`;
    link.href = gridDataUrl;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Codigos QR</h1>

      {/* Crear nuevos QRs */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Generar QRs</h2>
          <button
            onClick={generateNewQRs}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Generar 9 QRs Nuevos
          </button>
        </div>

        {codes.length > 0 && (
          <>
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">
                {codes.length === 1 ? 'QR para reimprimir' : 'Preview (9 QRs unicos)'}
              </h3>

              {codes.length === 1 ? (
                <div>
                  <QRGenerator code={codes[0]} size={200} />
                  <p className="text-xs text-gray-500 font-mono mt-2">
                    {codes[0]}
                  </p>
                  {selectedQR && (
                    <div className="mt-2 text-sm">
                      {selectedQR.itemName && (
                        <p><span className="text-gray-600">Item:</span> {selectedQR.itemName}</p>
                      )}
                      {selectedQR.roomName && (
                        <p><span className="text-gray-600">Habitacion:</span> {selectedQR.roomName}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {codes.map((code, i) => (
                    <div key={i} className="text-center">
                      <QRGenerator code={code} size={80} />
                      <p className="font-mono text-gray-500 mt-1">{code.slice(0, 8)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Imagen para imprimir (1080x1080)</h3>
              <QRGrid codes={codes} onReady={setGridDataUrl} />
              <p className="text-xs text-gray-500 mt-2">
                {codes.length === 1
                  ? 'Imagen con 1 QR grande para reimprimir'
                  : 'Cada QR es unico - imprime y pega en items diferentes'
                }
              </p>
            </div>

            <div className="border-t pt-4 flex gap-2 flex-wrap">
              {!selectedQR && codes.length > 1 && (
                <button
                  onClick={saveToFirestore}
                  disabled={saving || saved}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {saved ? `${codes.length} Guardados` : saving ? 'Guardando...' : `Guardar ${codes.length} QRs`}
                </button>
              )}

              <button
                onClick={downloadGrid}
                disabled={!gridDataUrl}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
              >
                Descargar Imagen
              </button>

              {selectedQR && (
                <Link
                  href={`/qr/${selectedQR.code}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ver/Editar Info
                </Link>
              )}
            </div>
          </>
        )}
      </div>

      {/* Lista de QRs guardados */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="font-semibold mb-3">QRs Guardados ({savedQRs.length})</h2>

        {loadingQRs ? (
          <p className="text-gray-500">Cargando...</p>
        ) : savedQRs.length === 0 ? (
          <p className="text-gray-500">No hay QRs guardados.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedQRs.map((qr) => (
              <div
                key={qr.id}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedQR?.code === qr.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => selectExistingQR(qr)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-gray-500 truncate">
                      {qr.code}
                    </p>

                    {qr.itemName || qr.roomName ? (
                      <div className="mt-1">
                        {qr.itemName && (
                          <p className="text-sm font-medium">{qr.itemName}</p>
                        )}
                        {qr.roomName && (
                          <p className="text-xs text-gray-600">
                            Habitacion: {qr.roomName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-orange-600 mt-1">
                        Sin asignar
                      </p>
                    )}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      selectExistingQR(qr);
                    }}
                    className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 shrink-0"
                  >
                    Reimprimir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="bg-yellow-50 p-4 rounded-lg text-sm text-yellow-800">
        <strong>Flujo:</strong>
        <ol className="list-decimal ml-4 mt-2 space-y-1">
          <li>Genera 9 QRs nuevos (cada uno es unico)</li>
          <li>Guardalos en la base de datos</li>
          <li>Descarga e imprime la imagen</li>
          <li>Pega cada QR en un item diferente</li>
          <li>Escanea cada QR y asignalo a su habitacion</li>
        </ol>
      </div>
    </div>
  );
}
