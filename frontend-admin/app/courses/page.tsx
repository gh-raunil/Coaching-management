'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function CoursesPage() {
  const router = useRouter();

  useEffect(() => {
    toast.info('Course addition and deletion are managed exclusively by the Super Admin.');
    router.replace('/dashboard');
  }, [router]);

  return null;
}
