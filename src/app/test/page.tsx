export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">テストページ</h1>
      <p>このページが表示されれば、基本的なルーティングは動作しています。</p>
      <div className="mt-4">
        <p>環境変数テスト:</p>
        <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定されています' : '設定されていません'}</p>
      </div>
    </div>
  );
}