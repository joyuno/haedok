'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar, MobileNav } from '@/components/layout';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <title>SubScout - 구독 관리 플랫폼</title>
        <meta
          name="description"
          content="구독 서비스를 효율적으로 관리하고 최적화하세요"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ThemeProvider>
          <div className="min-h-screen">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="lg:pl-64">
              <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
            </div>

            {/* Mobile Bottom Navigation */}
            <MobileNav />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
