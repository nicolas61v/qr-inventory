import Link from 'next/link';

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sistema de Inventario QR</h1>

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
    </div>
  );
}
