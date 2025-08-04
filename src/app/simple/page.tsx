'use client';

import { useEffect, useState } from 'react';

export default function SimplePage() {
  const [mounted, setMounted] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState('');

  useEffect(() => {
    setMounted(true);
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set');
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Test Page</h1>
      <p>If you can see this page, Next.js routing is working.</p>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h2>Environment Variables:</h2>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl}</p>
        <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
      </div>
      <div style={{ marginTop: '20px' }}>
        <a href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
          Go back to home
        </a>
      </div>
    </div>
  );
}