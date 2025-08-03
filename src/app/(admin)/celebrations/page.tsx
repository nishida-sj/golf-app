'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  Gift, Calendar, CheckCircle, Clock, 
  Plus, Edit2, Trash2, PartyPopper, Star 
} from 'lucide-react';

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
import { celebrationFormSchema, getCelebrationInfo, calculateAge } from '@/lib/validations';
import { Year, Member } from '@/types/database';
import { MemberCelebration, CelebrationFormData, CelebrationAge, CelebrationSummary } from '@/types/celebration';

const CELEBRATION_AGES: CelebrationAge[] = [60, 70, 77, 80];

export default function CelebrationsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [celebrations, setCelebrations] = useState<MemberCelebration[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CelebrationSummary>({
    total_members: 0,
    this_year_celebrations: 0,
    completed_this_year: 0,
    pending_this_year: 0,
    upcoming_celebrations: 0,
  });

  const form = useForm<CelebrationFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(celebrationFormSchema) as any,
    defaultValues: {
      member_id: '',
      age: 60,
      year_id: '',
      is_completed: false,
      completion_date: '',
      notes: '',
    },
  });

  const watchIsCompleted = form.watch('is_completed');

  // Fetch years
  const fetchYears = async () => {
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
  };

  // Fetch members
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  // Fetch celebrations for selected year
  const fetchCelebrations = async (yearId: string) => {
    if (!yearId) return;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.MEMBER_CELEBRATIONS)
        .select(`
          *,
          members!inner(name, birth_date, member_type)
        `)
        .eq('year_id', yearId);

      if (error) throw error;
      setCelebrations(data || []);
    } catch (error) {
      console.error('Error fetching celebrations:', error);
    }
  };

  // Calculate eligible members for current year celebrations
  const getEligibleMembers = () => {
    const currentYear = new Date().getFullYear();
    const eligibleMembers = [];

    for (const member of members) {
      const celebrationInfo = getCelebrationInfo(member.birth_date, currentYear);
      
      for (const celebration of celebrationInfo.upcoming_celebrations) {
        if (celebration.is_this_year || celebration.is_past_due) {
          // Check if already recorded
          const existing = celebrations.find(c => 
            c.member_id === member.id && c.age === celebration.age
          );
          
          if (!existing) {
            eligibleMembers.push({
              member,
              age: celebration.age,
              year_turning: celebration.year_turning,
              is_past_due: celebration.is_past_due,
            });
          }
        }
      }
    }

    return eligibleMembers;
  };

  // Calculate summary
  const calculateSummary = () => {
    const currentYear = new Date().getFullYear();
    const thisYearCelebrations = celebrations.filter(c => {
      const member = members.find(m => m.id === c.member_id);
      if (!member) return false;
      const birthYear = new Date(member.birth_date).getFullYear();
      return (birthYear + c.age) === currentYear;
    });

    const completedThisYear = thisYearCelebrations.filter(c => c.is_completed).length;
    const pendingThisYear = thisYearCelebrations.length - completedThisYear;
    
    // Count upcoming celebrations (next 5 years)
    let upcomingCount = 0;
    for (const member of members) {
      const celebrationInfo = getCelebrationInfo(member.birth_date, currentYear);
      upcomingCount += celebrationInfo.upcoming_celebrations.filter(c => c.is_upcoming).length;
    }

    setSummary({
      total_members: members.length,
      this_year_celebrations: thisYearCelebrations.length,
      completed_this_year: completedThisYear,
      pending_this_year: pendingThisYear,
      upcoming_celebrations: upcomingCount,
    });
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchYears(), fetchMembers()]);
      setLoading(false);
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchCelebrations(selectedYearId);
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (members.length > 0) {
      calculateSummary();
    }
  }, [members, celebrations]);

  // Handle year change
  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    form.setValue('year_id', yearId);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    form.reset({
      member_id: '',
      age: 60,
      year_id: selectedYearId,
      is_completed: false,
      completion_date: '',
      notes: '',
    });
  };

  // Submit celebration
  const onSubmit = async (data: CelebrationFormData) => {
    setSubmitting(true);
    try {
      // Remove completion_date if not completed
      if (!data.is_completed) {
        data.completion_date = undefined;
      }

      if (editingId) {
        // Update existing celebration
        const { error } = await supabase
          .from(DB_TABLES.MEMBER_CELEBRATIONS)
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new celebration
        const { error } = await supabase
          .from(DB_TABLES.MEMBER_CELEBRATIONS)
          .insert([data]);

        if (error) throw error;
      }

      resetForm();
      await fetchCelebrations(selectedYearId);
    } catch (error) {
      console.error('Error saving celebration:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing
  const startEdit = (celebration: MemberCelebration) => {
    setEditingId(celebration.id);
    form.reset({
      member_id: celebration.member_id,
      age: celebration.age,
      year_id: celebration.year_id,
      is_completed: celebration.is_completed,
      completion_date: celebration.completion_date || '',
      notes: celebration.notes || '',
    });
  };

  // Delete celebration
  const deleteCelebration = async (celebrationId: string) => {
    if (!confirm('このお祝い記録を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(DB_TABLES.MEMBER_CELEBRATIONS)
        .delete()
        .eq('id', celebrationId);

      if (error) throw error;
      await fetchCelebrations(selectedYearId);
    } catch (error) {
      console.error('Error deleting celebration:', error);
    }
  };

  // Toggle completion status
  const toggleCompletion = async (celebrationId: string, currentStatus: boolean) => {
    try {
      const updateData: { is_completed: boolean; completion_date?: string } = { is_completed: !currentStatus };
      
      if (!currentStatus) {
        // Mark as completed - set completion date to today
        updateData.completion_date = format(new Date(), 'yyyy-MM-dd');
      } else {
        // Mark as not completed - remove completion date
        updateData.completion_date = null;
      }

      const { error } = await supabase
        .from(DB_TABLES.MEMBER_CELEBRATIONS)
        .update(updateData)
        .eq('id', celebrationId);

      if (error) throw error;
      await fetchCelebrations(selectedYearId);
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  // Get age badge color
  const getAgeBadgeColor = (age: number) => {
    switch (age) {
      case 60: return 'bg-blue-100 text-blue-800';
      case 70: return 'bg-green-100 text-green-800';
      case 77: return 'bg-yellow-100 text-yellow-800';
      case 80: return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get celebration name
  const getCelebrationName = (age: number) => {
    switch (age) {
      case 60: return '還暦';
      case 70: return '古希';
      case 77: return '喜寿';
      case 80: return '傘寿';
      default: return `${age}歳`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>読み込み中...</p>
      </div>
    );
  }

  const eligibleMembers = getEligibleMembers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">お祝い管理</h1>
        <p className="mt-2 text-gray-600">会員の節目年齢のお祝い実施状況を管理します</p>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今年のお祝い</CardTitle>
                <PartyPopper className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {summary.this_year_celebrations}
                </div>
                <p className="text-xs text-muted-foreground">
                  名の会員が節目年齢
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">実施済み</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {summary.completed_this_year}
                </div>
                <p className="text-xs text-muted-foreground">
                  件のお祝いを実施済み
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">未実施</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {summary.pending_this_year}
                </div>
                <p className="text-xs text-muted-foreground">
                  件のお祝いが未実施
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">今後予定</CardTitle>
                <Star className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {summary.upcoming_celebrations}
                </div>
                <p className="text-xs text-muted-foreground">
                  件の今後のお祝い
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Eligible Members Alert */}
          {eligibleMembers.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">
                  お祝い対象者（{eligibleMembers.length}名）
                </CardTitle>
                <CardDescription className="text-orange-700">
                  以下の会員がお祝い対象年齢です。記録を追加してください。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {eligibleMembers.map((eligible, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{eligible.member.name}</div>
                          <div className="text-sm text-gray-600">
                            {getCelebrationName(eligible.age)}（{eligible.age}歳）
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          eligible.is_past_due ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                        }`}>
                          {eligible.is_past_due ? '過去' : '今年'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Celebration Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingId ? 'お祝い記録編集' : '新しいお祝い記録'}
              </CardTitle>
              <CardDescription>
                お祝いの実施状況を記録してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>会員</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="会員を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map((member) => {
                                const age = calculateAge(member.birth_date);
                                return (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.name} (現在{age}歳)
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>お祝い年齢</FormLabel>
                          <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {CELEBRATION_AGES.map((age) => (
                                <SelectItem key={age} value={String(age)}>
                                  {age}歳 ({getCelebrationName(age)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_completed"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm">実施済み</FormLabel>
                            <FormDescription className="text-xs">
                              お祝いを実施した場合
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
                  </div>

                  {watchIsCompleted && (
                    <FormField
                      control={form.control}
                      name="completion_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>実施日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>備考（任意）</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="お祝いの内容や特記事項があれば入力してください"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={submitting}>
                      {submitting ? '保存中...' : (editingId ? '更新' : '記録')}
                    </Button>
                    {editingId && (
                      <Button type="button" variant="outline" onClick={resetForm}>
                        キャンセル
                      </Button>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Celebrations List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                お祝い記録一覧
              </CardTitle>
              <CardDescription>
                登録済みのお祝い記録（{celebrations.length}件）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会員名</TableHead>
                    <TableHead>年齢</TableHead>
                    <TableHead>実施状況</TableHead>
                    <TableHead>実施日</TableHead>
                    <TableHead>備考</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {celebrations.map((celebration) => {
                    const member = members.find(m => m.id === celebration.member_id);
                    if (!member) return null;

                    return (
                      <TableRow key={celebration.id}>
                        <TableCell className="font-medium">
                          {member.name}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAgeBadgeColor(celebration.age)}`}>
                            {celebration.age}歳 ({getCelebrationName(celebration.age)})
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={celebration.is_completed}
                              onCheckedChange={() => toggleCompletion(celebration.id, celebration.is_completed)}
                            />
                            <span className={`text-sm ${celebration.is_completed ? 'text-green-600' : 'text-gray-500'}`}>
                              {celebration.is_completed ? '実施済み' : '未実施'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {celebration.completion_date ? (
                            format(new Date(celebration.completion_date), 'yyyy/MM/dd')
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {celebration.notes || (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(celebration)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteCelebration(celebration.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {celebrations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この年度のお祝い記録がありません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}