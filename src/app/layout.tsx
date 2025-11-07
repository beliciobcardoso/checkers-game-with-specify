import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/components/providers/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Checkers Game - Jogo de Damas Online',
  description:
    'Jogue damas online contra amigos ou contra a IA. Modo local, multiplayer online e bot com diferentes níveis de dificuldade.',
  keywords: ['damas', 'checkers', 'jogo online', 'multiplayer', 'bot'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">{children}</div>
        </SessionProvider>
      </body>
    </html>
  );
}
