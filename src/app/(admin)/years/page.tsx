'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Edit2, Check, X } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { yearFormSchema } from '@/lib/validations';
import { Year } from '@/types/database';
import { YearFormData } from '@/types/common';

export default function YearsPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Year>>({});

  const form = useForm<YearFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(yearFormSchema) as any,
    defaultValues: {
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
    },
  });

  // Fetch years from Supabase
  const fetchYears = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.YEARS)
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setYears(data || []);
    } catch (error) {
      console.error('Error fetching years:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchYears();
  }, [fetchYears]);

  // Create new year
  const onSubmit = async (data: YearFormData) => {
    try {
      // If setting as active, first deactivate all other years
      if (data.is_active) {
        await supabase
          .from(DB_TABLES.YEARS)
          .update({ is_active: false })
          .neq('id', '');
      }

      const { error } = await supabase
        .from(DB_TABLES.YEARS)
        .insert([data]);

      if (error) throw error;

      form.reset();
      await fetchYears();
    } catch (error) {
      console.error('Error creating year:', error);
    }
  };

  // Toggle active status
  const toggleActive = async (yearId: string) => {
    try {
      // First deactivate all years
      await supabase
        .from(DB_TABLES.YEARS)
        .update({ is_active: false })
        .neq('id', '');

      // Then activate the selected year
      const { error } = await supabase
        .from(DB_TABLES.YEARS)
        .update({ is_active: true })
        .eq('id', yearId);

      if (error) throw error;
      await fetchYears();
    } catch (error) {
      console.error('Error updating active status:', error);
    }
  };

  // Start editing
  const startEdit = (year: Year) => {
    setEditingId(year.id);
    setEditForm({
      name: year.name,
      start_date: year.start_date,
      end_date: year.end_date,
    });
  };

  // Save edit
  const saveEdit = async (yearId: string) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.YEARS)
        .update(editForm)
        .eq('id', yearId);

      if (error) throw error;

      setEditingId(null);
      setEditForm({});
      await fetchYears();
    } catch (error) {
      console.error('Error updating year:', error);
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
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
        <h1 className="text-3xl font-bold text-gray-900">年度管理</h1>
        <p className="mt-2 text-gray-600">年度の作成・編集・アクティブ設定を行います</p>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <CardTitle>新しい年度を作成</CardTitle>
          <CardDescription>年度情報を入力してください</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年度名</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 2024年度" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開始日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>終了日</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">アクティブ年度に設定</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        この年度をアクティブな年度として設定します
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
              <Button type="submit">年度を作成</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Years Table */}
      <Card>
        <CardHeader>
          <CardTitle>年度一覧</CardTitle>
          <CardDescription>登録済みの年度を管理します</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>年度名</TableHead>
                <TableHead>開始日</TableHead>
                <TableHead>終了日</TableHead>
                <TableHead>アクティブ</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((year) => (
                <TableRow key={year.id}>
                  <TableCell>
                    {editingId === year.id ? (
                      <Input
                        value={editForm.name || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                      />
                    ) : (
                      year.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === year.id ? (
                      <Input
                        type="date"
                        value={editForm.start_date || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, start_date: e.target.value })
                        }
                      />
                    ) : (
                      format(new Date(year.start_date), 'yyyy-MM-dd')
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === year.id ? (
                      <Input
                        type="date"
                        value={editForm.end_date || ''}
                        onChange={(e) =>
                          setEditForm({ ...editForm, end_date: e.target.value })
                        }
                      />
                    ) : (
                      format(new Date(year.end_date), 'yyyy-MM-dd')
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={year.is_active}
                      onCheckedChange={() => toggleActive(year.id)}
                      disabled={editingId === year.id}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {editingId === year.id ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => saveEdit(year.id)}
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
                          onClick={() => startEdit(year)}
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
        </CardContent>
      </Card>
    </div>
  );
}