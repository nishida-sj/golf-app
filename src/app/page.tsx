import Link from 'next/link';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, Settings } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-green-600 p-4 rounded-full">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ゴルフ会管理システム
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            会員管理、コンペ運営、出欠管理を一元化。
            効率的なゴルフ会運営をサポートします。
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>会員管理</CardTitle>
              <CardDescription>
                会員情報の登録・管理、年齢計算、会費管理
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <Trophy className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>コンペ管理</CardTitle>
              <CardDescription>
                コンペ作成、組み合わせ表作成、結果管理
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>出欠管理</CardTitle>
              <CardDescription>
                オンライン出欠受付、参加者管理、お祝い会対応
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          <div className="space-x-4">
            <Link href="/admin">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                <Settings className="h-5 w-5 mr-2" />
                管理画面へ
              </Button>
            </Link>
          </div>
          <p className="text-sm text-gray-500">
            管理機能：年度管理・会員管理・コンペ管理・財務管理・お祝い管理
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-20 pt-8 border-t border-gray-200">
          <p className="text-gray-500">
            © 2025 ゴルフ会管理システム - Next.js & Supabase by 西田商事株式会社
          </p>
        </div>
      </div>
    </div>
  );
}
