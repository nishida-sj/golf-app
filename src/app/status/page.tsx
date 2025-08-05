import Link from 'next/link';

export default function StatusPage() {
  return (
    <html>
      <head>
        <title>Status Check</title>
      </head>
      <body>
        <h1>App Status: Running</h1>
        <p>If you can see this page, the basic App Router is working.</p>
        <ul>
          <li>Framework: Next.js 15</li>
          <li>Router: App Router</li>
          <li>Environment: Production</li>
          <li>Time: {new Date().toISOString()}</li>
        </ul>
        <div>
          <Link href="/">← Back to Home</Link>
        </div>
      </body>
    </html>
  );
}