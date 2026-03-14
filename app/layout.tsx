import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: 'Receipt Accounting UI',
  description: 'Small business expense capture platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <TopNav />
          <main className="container">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
