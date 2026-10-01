import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Superadmin Portal | Multi-Tenant Tuition Platform',
  description: 'Centralized administration for all coaching branches, student metrics, and collected revenue.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans">
        <Toaster position="top-right" richColors />
        {children}
      </body>
    </html>
  );
}
