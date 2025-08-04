'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabasePage() {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [envVars, setEnvVars] = useState({});

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Supabase connection
        const { data, error } = await supabase
          .from('years')
          .select('count')
          .limit(1);
        
        if (error) {
          setConnectionStatus(`Connection Error: ${error.message}`);
        } else {
          setConnectionStatus('✅ Supabase Connected Successfully');
        }
      } catch (err) {
        setConnectionStatus(`❌ Connection Failed: ${err}`);
      }
    };

    setEnvVars({
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set',
      NODE_ENV: process.env.NODE_ENV
    });

    testConnection();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Supabase Connection Test</h1>
      
      <h2>Environment Variables:</h2>
      <pre style={{ background: '#f5f5f5', padding: '10px' }}>
        {JSON.stringify(envVars, null, 2)}
      </pre>
      
      <h2>Connection Status:</h2>
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
        {connectionStatus}
      </p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}