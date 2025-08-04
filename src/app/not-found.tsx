import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          ページが見つかりません
        </h2>
        <p className="text-gray-600 mb-8">
          お探しのページは存在しないか、移動した可能性があります。
        </p>
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ホームに戻る
          </Link>
          <div className="text-sm text-gray-500">
            <p>デバッグ情報:</p>
            <p>現在時刻: {new Date().toISOString()}</p>
            <p>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent : 'Server-side'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}