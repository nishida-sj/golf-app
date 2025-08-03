import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">管理画面ダッシュボード</h1>
        <p className="mt-2 text-gray-600">ゴルフ会の各種管理機能にアクセスできます</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>年度管理</CardTitle>
            <CardDescription>年度の作成・編集・アクティブ設定</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/years">
              <Button className="w-full">年度管理へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>会員管理</CardTitle>
            <CardDescription>会員情報の登録・編集・管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/members">
              <Button className="w-full">会員管理へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>会費管理</CardTitle>
            <CardDescription>会費設定・支払い状況の管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/fees">
              <Button className="w-full">会費管理へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>コンペ管理</CardTitle>
            <CardDescription>コンペの作成・編集・組み合わせ</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/competitions">
              <Button className="w-full">コンペ管理へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>入出金管理</CardTitle>
            <CardDescription>収支の記録・管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/finances">
              <Button className="w-full">入出金管理へ</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>お祝い管理</CardTitle>
            <CardDescription>年齢別お祝いの管理</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/celebrations">
              <Button className="w-full">お祝い管理へ</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}