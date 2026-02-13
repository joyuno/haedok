'use client';

import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar, TopBar, MobileNav } from '@/components/layout';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { SupabaseSyncProvider } from '@/components/SupabaseSyncProvider';
import { SessionTimeoutDialog } from '@/components/SessionTimeoutDialog';

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
        <title>해독 - 구독의 독을 해독하다</title>
        <meta
          name="description"
          content="구독의 독을 해독하세요. 불필요한 구독을 찾아내고 절약하는 스마트 구독 매니저"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SupabaseSyncProvider />
            <SessionTimeoutDialog />
            <div className="min-h-screen">
              {/* Desktop Sidebar */}
              <Sidebar />

              {/* Main Content Area */}
              <div className="lg:pl-64">
                {/* Top Bar with Auth (right-aligned) */}
                <TopBar />
                <main className="min-h-screen pb-20 lg:pb-0">{children}</main>
              </div>

              {/* Mobile Bottom Navigation */}
              <MobileNav />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
