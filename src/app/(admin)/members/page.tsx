'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Edit2, Check, X, UserPlus, FileText, ExternalLink } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { supabase, DB_TABLES } from '@/lib/supabase';
import { memberFormSchema, calculateAge } from '@/lib/validations';
import { MemberFormData } from '@/types/common';
import { Member, MemberWithAge } from '@/types/database';

const MEMBER_TYPES = ['会員', '旧会員', '配偶者', 'ゲスト'] as const;

export default function MembersPage() {
  const [members, setMembers] = useState<MemberWithAge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Member>>({});
  
  // Check report states
  const [reportTitle, setReportTitle] = useState('');
  const [selectedMemberTypes, setSelectedMemberTypes] = useState<string[]>(['会員']);

  const form = useForm<MemberFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(memberFormSchema) as any,
    defaultValues: {
      name: '',
      birth_date: '',
      member_type: '会員',
      is_active: true,
    },
  });

  // Fetch members from Supabase
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add age calculation to each member
      const membersWithAge = (data || []).map(member => ({
        ...member,
        age: calculateAge(member.birth_date),
      }));

      setMembers(membersWithAge);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Create new member
  const onSubmit = async (data: MemberFormData) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.MEMBERS)
        .insert([data]);

      if (error) throw error;

      form.reset();
      await fetchMembers();
    } catch (error) {
      console.error('Error creating member:', error);
    }
  };

  // Start editing
  const startEdit = (member: Member) => {
    setEditingId(member.id);
    setEditForm({
      name: member.name,
      birth_date: member.birth_date,
      member_type: member.member_type,
      is_active: member.is_active,
    });
  };

  // Save edit
  const saveEdit = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.MEMBERS)
        .update(editForm)
        .eq('id', memberId);

      if (error) throw error;

      setEditingId(null);
      setEditForm({});
      await fetchMembers();
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Toggle active status
  const toggleActive = async (memberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.MEMBERS)
        .update({ is_active: !currentStatus })
        .eq('id', memberId);

      if (error) throw error;
      await fetchMembers();
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  };

  // Get badge color for member type
  const getBadgeColor = (memberType: string) => {
    switch (memberType) {
      case '会員':
        return 'bg-green-100 text-green-800';
      case '旧会員':
        return 'bg-gray-100 text-gray-800';
      case '配偶者':
        return 'bg-blue-100 text-blue-800';
      case 'ゲスト':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle member type selection for report
  const toggleMemberType = (type: string) => {
    setSelectedMemberTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Get filtered members for report
  const getReportMembers = () => {
    return members.filter(member => 
      selectedMemberTypes.includes(member.member_type) && member.is_active
    ).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Generate and open report in new window
  const generateReport = () => {
    if (!reportTitle.trim()) {
      alert('帳票名を入力してください');
      return;
    }
    if (selectedMemberTypes.length === 0) {
      alert('対象会員区分を選択してください');
      return;
    }
    
    const reportMembers = getReportMembers();
    let globalIndex = 0;
    
    const reportHTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle}</title>
    <style>
        @page {
            size: A4;
            margin: 15mm;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: #000;
        }
        
        .report-title {
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 8px;
        }
        
        .report-section {
            margin-bottom: 20px;
        }
        
        .report-section-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            background-color: #f0f0f0;
            padding: 4px 8px;
        }
        
        .members-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            column-gap: 20px;
        }
        
        .member-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 3px 0;
            border-bottom: 1px solid #ddd;
            width: 100%;
        }
        
        .member-name {
            font-size: 14px;
            font-weight: 400;
        }
        
        .checkbox {
            width: 16px;
            height: 16px;
            border: 2px solid #000;
            display: inline-block;
            background-color: #fff;
        }
        
        .summary {
            margin-top: 15px;
            padding: 10px;
            border: 1px solid #000;
            background-color: #f9f9f9;
            font-size: 11px;
        }
        
        .summary-title {
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .age-info {
            margin-left: 10px;
            font-size: 10px;
            color: #666;
        }
        
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="report-title">
        ${reportTitle}
    </div>
    
    ${selectedMemberTypes.map((memberType) => {
      const typeMembers = reportMembers.filter(m => m.member_type === memberType);
      if (typeMembers.length === 0) return '';
      
      return `
    <div class="report-section">
        ${selectedMemberTypes.length > 1 ? `
        <div class="report-section-title">
            ${memberType} (${typeMembers.length}名)
        </div>` : ''}
        
        <div class="members-grid">
            ${typeMembers.map((member) => {
              globalIndex++;
              return `
            <div class="member-item">
                <div class="member-info">
                    <span class="member-name">
                        ${globalIndex}. ${member.name}
                    </span>
                    ${selectedMemberTypes.length === 1 ? `
                    <span class="age-info">
                        (${member.age}歳)
                    </span>` : ''}
                </div>
                <div class="checkbox"></div>
            </div>`;
            }).join('')}
        </div>
    </div>`;
    }).join('')}
    
    <div class="summary">
        <div class="summary-title">集計</div>
        <div>対象会員区分: ${selectedMemberTypes.join(', ')}</div>
        <div>総数: ${reportMembers.length}名</div>
        <div>作成日: ${format(new Date(), 'yyyy年MM月dd日')}</div>
    </div>
</body>
</html>`;

    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(reportHTML);
      newWindow.document.close();
      newWindow.focus();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">会員管理</h1>
          <p className="mt-2 text-gray-600">会員情報の登録・編集・管理を行います</p>
        </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            新しい会員を登録
          </CardTitle>
          <CardDescription>会員情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>氏名</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 山田太郎" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>生年月日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="member_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>会員区分</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="会員区分を選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MEMBER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 w-full">
                        <div className="space-y-0.5">
                          <FormLabel className="text-sm">アクティブ</FormLabel>
                          <div className="text-xs text-muted-foreground">
                            有効な会員
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full md:w-auto">
                会員を登録
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Check Report Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            チェック帳票作成
          </CardTitle>
          <CardDescription>
            会員ごとにチェックボックス付きの帳票を新しいタブで表示します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Report Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                帳票名
              </label>
              <Input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="例: 出欠確認表"
                className="w-full"
              />
            </div>

            {/* Member Type Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                対象会員区分
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MEMBER_TYPES.map((type) => (
                  <label
                    key={type}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMemberTypes.includes(type)}
                      onChange={() => toggleMemberType(type)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm px-2 py-1 rounded ${getBadgeColor(type)}`}>
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              onClick={generateReport}
              disabled={!reportTitle.trim() || selectedMemberTypes.length === 0}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              帳票を新しいタブで表示
            </Button>
            
            <div className="text-sm text-gray-600">
              対象会員: {getReportMembers().length}名
            </div>
          </div>
          
          <div className="text-sm text-gray-500 mt-2">
            ※ 新しいタブで帳票が開きますので、そちらでブラウザの印刷機能をご利用ください
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>会員一覧</CardTitle>
          <CardDescription>
            登録済みの会員を管理します（{members.length}名）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>氏名</TableHead>
                <TableHead>生年月日</TableHead>
                <TableHead>年齢</TableHead>
                <TableHead>会員区分</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead>登録日</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {editingId === member.id ? (
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      member.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === member.id ? (
                      <Input
                        type="date"
                        value={editForm.birth_date || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, birth_date: e.target.value })
                        }
                      />
                    ) : (
                      format(new Date(member.birth_date), 'yyyy-MM-dd')
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">
                      {editingId === member.id && editForm.birth_date
                        ? calculateAge(editForm.birth_date)
                        : member.age}歳
                    </span>
                  </TableCell>
                  <TableCell>
                    {editingId === member.id ? (
                      <Select
                        value={editForm.member_type || member.member_type}
                        onValueChange={(value) =>
                          setEditForm({ ...editForm, member_type: value as '会員' | '旧会員' | '配偶者' | 'ゲスト' })
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MEMBER_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(
                          member.member_type
                        )}`}
                      >
                        {member.member_type}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === member.id ? (
                      <Switch
                        checked={editForm.is_active ?? member.is_active}
                        onCheckedChange={(checked) =>
                          setEditForm({ ...editForm, is_active: checked })
                        }
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={member.is_active}
                          onCheckedChange={() => toggleActive(member.id, member.is_active)}
                        />
                        <span className="text-sm text-gray-500">
                          {member.is_active ? 'アクティブ' : '非アクティブ'}
                        </span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {format(new Date(member.created_at), 'yyyy-MM-dd')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {editingId === member.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveEdit(member.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(member)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              会員が登録されていません
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}