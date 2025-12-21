'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Inicio' },
    { href: '/rooms', label: 'Habitaciones' },
    { href: '/qr', label: 'Crear QR' },
    { href: '/scan', label: 'Escanear' },
  ];

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="max-w-4xl mx-auto flex gap-4 flex-wrap">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1 rounded ${
              pathname === link.href
                ? 'bg-blue-600'
                : 'hover:bg-gray-700'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
