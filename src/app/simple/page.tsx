export default function SimplePage() {
  return (
    <html>
      <head>
        <title>Simple Test Page</title>
      </head>
      <body style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1>Simple Test Page</h1>
        <p>If you can see this page, Next.js routing is working.</p>
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
          <h2>Environment Variables:</h2>
          <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not set'}</p>
          <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
          <p><strong>Vercel:</strong> {process.env.VERCEL ? 'Yes' : 'No'}</p>
        </div>
        <div style={{ marginTop: '20px' }}>
          <button onClick={() => window.location.href = '/'} style={{ color: 'blue', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>
            Go back to home
          </button>
        </div>
      </body>
    </html>
  );
}