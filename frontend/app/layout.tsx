import type { Metadata } from 'next';
import { Inter, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { SystemModalProvider } from '@/components/system/SystemModalProvider';
import { QueryProvider } from '@/components/QueryProvider';
import { GlobalApiLoader } from '@/components/common/GlobalApiLoader';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-dm-sans',
});

export const metadata: Metadata = {
  title: 'Medoflow | The Operating System for Modern Clinics',
  description: 'Stop piecing together scheduling, EHR, and billing tools. Run your entire practice on one unified timeline, from patient intake to revenue.',
  icons: {
    icon: '/Medoflow-logo.svg',
    apple: '/medoflow-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${dmSans.variable} font-sans antialiased bg-white`}>
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
