import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Coaching Management Portal',
  description: 'Manage students, live billing receipts, courses, batches, and collected tuition fees.',
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
