import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemModalProvider } from '@/components/system/SystemModalProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { GlobalApiLoader } from '@/components/common/GlobalApiLoader';
import { Toaster } from '@/components/ui/sonner';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-sans',
});

export const metadata: Metadata = {
  title: 'Medoflow',
  description: 'Clinical SaaS Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlexSans.variable} font-sans antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <SystemModalProvider>
              {children}
              <GlobalApiLoader />
            </SystemModalProvider>
          </AuthProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
