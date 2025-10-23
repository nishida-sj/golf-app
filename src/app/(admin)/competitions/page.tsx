'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Trophy, Calendar, MapPin, Clock, Edit2, Trash2, Plus, ExternalLink, Copy, UsersRound, Download } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  FormDescription,
} from '@/components/ui/form';

import { supabase, DB_TABLES } from '@/lib/supabase';
import { competitionFormSchema } from '@/lib/validations';
import { convertToCSV, downloadCSV } from '@/lib/csv';
import { Year } from '@/types/database';
import { Competition, CompetitionFormData } from '@/types/competition';
import Link from 'next/link';

export default function CompetitionsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const form = useForm<CompetitionFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(competitionFormSchema) as any,
    defaultValues: {
      year_id: '',
      name: '',
      golf_course: '',
      start_time: '',
      title: '',
      rules: '',
      fee: 0,
      custom_field_1: '',
      custom_field_2: '',
      custom_field_3: '',
      has_celebration: false,
      celebration_venue: '',
      celebration_start_time: '',
      celebration_fee: 0,
    },
  });

  const watchHasCelebration = form.watch('has_celebration');

  // Fetch years from Supabase
  const fetchYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.YEARS)
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setYears(data || []);
      
      // Set active year as default
      const activeYear = data?.find(year => year.is_active);
      if (activeYear) {
        setSelectedYearId(activeYear.id);
        form.setValue('year_id', activeYear.id);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  }, []);

  // Fetch competitions for selected year
  const fetchCompetitions = async (yearId: string) => {
    if (!yearId) return;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.COMPETITIONS)
        .select('*')
        .eq('year_id', yearId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setCompetitions(data || []);
    } catch (error) {
      console.error('Error fetching competitions:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchYears();
      setLoading(false);
    };
    initializeData();
  }, [fetchYears]);

  useEffect(() => {
    if (selectedYearId) {
      fetchCompetitions(selectedYearId);
    }
  }, [selectedYearId]);

  // Handle year selection change
  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    form.setValue('year_id', yearId);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    form.reset({
      year_id: selectedYearId,
      name: '',
      golf_course: '',
      start_time: '',
      title: '',
      rules: '',
      fee: 0,
      custom_field_1: '',
      custom_field_2: '',
      custom_field_3: '',
      has_celebration: false,
      celebration_venue: '',
      celebration_start_time: '',
      celebration_fee: 0,
    });
  };

  // Create or update competition
  const onSubmit = async (data: CompetitionFormData) => {
    try {
      // Prepare data for submission
      const submitData: Record<string, unknown> = {
        year_id: data.year_id,
        name: data.name,
        golf_course: data.golf_course,
        start_time: data.start_time,
        title: data.title,
        rules: data.rules,
        fee: data.fee,
        custom_field_1: data.custom_field_1 || null,
        custom_field_2: data.custom_field_2 || null,
        custom_field_3: data.custom_field_3 || null,
        has_celebration: data.has_celebration,
      };

      // Add celebration fields only if enabled and have values
      if (data.has_celebration && data.celebration_venue) {
        submitData.celebration_venue = data.celebration_venue;
      } else {
        submitData.celebration_venue = null;
      }

      if (data.has_celebration && data.celebration_start_time) {
        submitData.celebration_start_time = data.celebration_start_time;
      } else {
        submitData.celebration_start_time = null;
      }

      if (data.has_celebration && data.celebration_fee) {
        submitData.celebration_fee = data.celebration_fee;
      } else {
        submitData.celebration_fee = null;
      }

      if (isEditing && editingId) {
        // Update existing competition
        const { error } = await supabase
          .from(DB_TABLES.COMPETITIONS)
          .update(submitData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new competition
        const { error } = await supabase
          .from(DB_TABLES.COMPETITIONS)
          .insert([submitData]);

        if (error) throw error;
      }

      resetForm();
      await fetchCompetitions(selectedYearId);
    } catch (error) {
      console.error('Error saving competition:', error);
    }
  };

  // Start editing
  const startEdit = (competition: Competition) => {
    setIsEditing(true);
    setEditingId(competition.id);
    
    form.reset({
      year_id: competition.year_id,
      name: competition.name,
      golf_course: competition.golf_course,
      start_time: competition.start_time,
      title: competition.title,
      rules: competition.rules,
      fee: competition.fee,
      custom_field_1: competition.custom_field_1 || '',
      custom_field_2: competition.custom_field_2 || '',
      custom_field_3: competition.custom_field_3 || '',
      has_celebration: competition.has_celebration,
      celebration_venue: competition.celebration_venue || '',
      celebration_start_time: competition.celebration_start_time || '',
      celebration_fee: competition.celebration_fee || 0,
    });
  };

  // Delete competition
  const deleteCompetition = async (competitionId: string) => {
    if (!confirm('このコンペを削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(DB_TABLES.COMPETITIONS)
        .delete()
        .eq('id', competitionId);

      if (error) throw error;
      await fetchCompetitions(selectedYearId);
    } catch (error) {
      console.error('Error deleting competition:', error);
    }
  };

  // Format date and time for display
  const formatDateTime = (dateTimeString: string) => {
    try {
      return format(new Date(dateTimeString), 'yyyy-MM-dd HH:mm');
    } catch {
      return dateTimeString;
    }
  };

  // Copy attendance URL to clipboard
  const copyAttendanceUrl = async (competitionId: string) => {
    const url = `${window.location.origin}/attendance/${competitionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(competitionId);
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Open attendance page in new tab
  const openAttendancePage = (competitionId: string) => {
    const url = `${window.location.origin}/attendance/${competitionId}`;
    window.open(url, '_blank');
  };

  // Export participant data as CSV
  const exportParticipantData = async (competition: Competition) => {
    try {
      const response = await fetch(`/api/competitions/${competition.id}/export`);

      if (!response.ok) {
        throw new Error('データの取得に失敗しました');
      }

      const data = await response.json();
      const csvContent = convertToCSV(data.participants, data.has_celebration);
      const filename = `${competition.name}_参加者データ_${format(new Date(), 'yyyyMMdd')}.csv`;

      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Error exporting participant data:', error);
      alert('参加者データの出力に失敗しました');
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
        <h1 className="text-3xl font-bold text-gray-900">コンペ管理</h1>
        <p className="mt-2 text-gray-600">ゴルフコンペの作成・編集・管理を行います</p>
      </div>

      {/* Year Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            年度選択
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedYearId} onValueChange={handleYearChange}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="年度を選択してください" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.name} {year.is_active && '(アクティブ)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedYearId && (
        <>
          {/* Competition Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {isEditing ? 'コンペ編集' : '新しいコンペを作成'}
              </CardTitle>
              <CardDescription>
                {isEditing ? 'コンペ情報を編集してください' : 'コンペ情報を入力してください'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>コンペ名</FormLabel>
                          <FormControl>
                            <Input placeholder="例: 春季コンペ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="golf_course"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ゴルフ場名</FormLabel>
                          <FormControl>
                            <Input placeholder="例: ○○ゴルフクラブ" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>開始日時</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>参加費（円）</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>タイトル</FormLabel>
                        <FormControl>
                          <Input placeholder="コンペのタイトルや説明" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rules"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ルール・注意事項</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="コンペのルールや注意事項を入力してください"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">自由入力欄</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="custom_field_1"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>自由入力欄1</FormLabel>
                            <FormControl>
                              <Input placeholder="任意の情報" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="custom_field_2"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>自由入力欄2</FormLabel>
                            <FormControl>
                              <Input placeholder="任意の情報" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="custom_field_3"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>自由入力欄3</FormLabel>
                            <FormControl>
                              <Input placeholder="任意の情報" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Celebration Settings */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="has_celebration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">祝賀会</FormLabel>
                            <FormDescription>
                              コンペ後に祝賀会を開催する場合はオンにしてください
                            </FormDescription>
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

                    {watchHasCelebration && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-blue-200">
                        <FormField
                          control={form.control}
                          name="celebration_venue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>祝賀会会場</FormLabel>
                              <FormControl>
                                <Input placeholder="例: ○○レストラン" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="celebration_start_time"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>祝賀会開始時間</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="celebration_fee"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>祝賀会費（円）</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit">
                      {isEditing ? '更新' : '作成'}
                    </Button>
                    {isEditing && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        キャンセル
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Competitions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                コンペ一覧
              </CardTitle>
              <CardDescription>
                登録済みのコンペを管理します（{competitions.length}件）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>コンペ名</TableHead>
                    <TableHead>ゴルフ場</TableHead>
                    <TableHead>開始日時</TableHead>
                    <TableHead>参加費</TableHead>
                    <TableHead>祝賀会</TableHead>
                    <TableHead>出欠ページ</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitions.map((competition) => (
                    <TableRow key={competition.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{competition.name}</div>
                          <div className="text-sm text-gray-500">{competition.title}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {competition.golf_course}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          {formatDateTime(competition.start_time)}
                        </div>
                      </TableCell>
                      <TableCell>¥{competition.fee.toLocaleString()}</TableCell>
                      <TableCell>
                        {competition.has_celebration ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              あり
                            </span>
                            {competition.celebration_venue && (
                              <div className="text-xs text-gray-500">
                                {competition.celebration_venue}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            なし
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAttendancePage(competition.id)}
                            title="出欠ページを開く"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyAttendanceUrl(competition.id)}
                            title="出欠URL をコピー"
                          >
                            {copiedUrl === competition.id ? (
                              <span className="text-green-600 text-xs">✓</span>
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          /attendance/{competition.id}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Link href={`/competitions/${competition.id}/grouping`}>
                            <Button
                              size="sm"
                              variant="outline"
                              title="組み合わせ表"
                            >
                              <UsersRound className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => exportParticipantData(competition)}
                            title="参加者データ出力"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(competition)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteCompetition(competition.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {competitions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この年度のコンペが登録されていません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}