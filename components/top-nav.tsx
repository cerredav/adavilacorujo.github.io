'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/upload', label: 'Upload' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/reports/monthly', label: 'Monthly Report' },
];

export function TopNav() {
  const pathname = usePathname();
  return (
    <nav className="top-nav">
      {links.map((link) => (
        <Link key={link.href} href={link.href} className={pathname.startsWith(link.href) ? 'active' : ''}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
