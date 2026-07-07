"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminScreen from '@/components/AdminScreen';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login');
        return;
      }
      
      supabase.from('profiles').select('is_admin').eq('id', session.user.id).single().then(({ data }) => {
        if (!data?.is_admin && process.env.NODE_ENV !== 'development') {
          router.push('/upload');
        } else {
          setLoading(false);
        }
      });
    });
  }, [router]);

  if (loading) return null;

  return <AdminScreen />;
}
