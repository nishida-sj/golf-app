'use client';

export default function DebugPage() {
  const envVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_URL: process.env.VERCEL_URL,
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Debug Information</h1>
      <h2>Environment Variables:</h2>
      <pre>{JSON.stringify(envVars, null, 2)}</pre>
      
      <h2>Runtime Info:</h2>
      <ul>
        <li>Server-side rendering: {typeof window === 'undefined' ? 'Yes' : 'No'}</li>
        <li>Timestamp: {new Date().toISOString()}</li>
      </ul>
      
      <h2>Navigation Test:</h2>
      <div style={{ marginTop: '10px' }}>
        <button 
          onClick={() => window.location.href = '/'}
          style={{ 
            padding: '10px', 
            margin: '5px', 
            backgroundColor: '#0070f3', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Home
        </button>
        <button 
          onClick={() => window.location.href = '/years'}
          style={{ 
            padding: '10px', 
            margin: '5px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go to Years
        </button>
      </div>
    </div>
  );
}