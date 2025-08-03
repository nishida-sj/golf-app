'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Edit2, Trash2, Receipt, Wallet 
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
import { transactionFormSchema } from '@/lib/validations';
import { Year } from '@/types/database';
import { Transaction, TransactionFormData, FinancialSummary } from '@/types/finance';

export default function FinancesPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    feeIncome: 0,
    otherIncome: 0,
    regularExpense: 0,
    reimbursementExpense: 0,
  });

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      year_id: '',
      type: 'expense',
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      is_reimbursement: false,
    },
  });

  const watchType = form.watch('type');

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

  // Fetch transactions for selected year
  const fetchTransactions = async (yearId: string) => {
    if (!yearId) return;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.TRANSACTIONS)
        .select('*')
        .eq('year_id', yearId)
        .order('transaction_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  // Fetch fee payments as income
  const fetchFeeIncome = async (yearId: string) => {
    if (!yearId) return 0;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.FEE_PAYMENTS)
        .select('amount')
        .eq('year_id', yearId);

      if (error) throw error;
      return (data || []).reduce((sum, payment) => sum + payment.amount, 0);
    } catch (error) {
      console.error('Error fetching fee income:', error);
      return 0;
    }
  };

  // Calculate financial summary
  const calculateSummary = async (yearId: string, transactionList: Transaction[]) => {
    const feeIncome = await fetchFeeIncome(yearId);
    
    const income = transactionList
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = transactionList
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const regularExpense = transactionList
      .filter(t => t.type === 'expense' && !t.is_reimbursement)
      .reduce((sum, t) => sum + t.amount, 0);

    const reimbursementExpense = transactionList
      .filter(t => t.type === 'expense' && t.is_reimbursement)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalIncome = feeIncome + income;
    const totalExpense = expense;
    const balance = totalIncome - totalExpense;

    setSummary({
      totalIncome,
      totalExpense,
      balance,
      feeIncome,
      otherIncome: income,
      regularExpense,
      reimbursementExpense,
    });
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await fetchYears();
      setLoading(false);
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedYearId) {
      fetchTransactions(selectedYearId);
    }
  }, [selectedYearId]);

  useEffect(() => {
    if (selectedYearId && transactions) {
      calculateSummary(selectedYearId, transactions);
    }
  }, [selectedYearId, transactions]);

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
      year_id: selectedYearId,
      type: 'expense',
      amount: 0,
      description: '',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
      is_reimbursement: false,
    });
  };

  // Submit transaction
  const onSubmit = async (data: TransactionFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing transaction
        const { error } = await supabase
          .from(DB_TABLES.TRANSACTIONS)
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new transaction
        const { error } = await supabase
          .from(DB_TABLES.TRANSACTIONS)
          .insert([data]);

        if (error) throw error;
      }

      resetForm();
      await fetchTransactions(selectedYearId);
    } catch (error) {
      console.error('Error saving transaction:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing
  const startEdit = (transaction: Transaction) => {
    setEditingId(transaction.id);
    form.reset({
      year_id: transaction.year_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      transaction_date: transaction.transaction_date,
      is_reimbursement: transaction.is_reimbursement,
    });
  };

  // Delete transaction
  const deleteTransaction = async (transactionId: string) => {
    if (!confirm('この取引を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      const { error } = await supabase
        .from(DB_TABLES.TRANSACTIONS)
        .delete()
        .eq('id', transactionId);

      if (error) throw error;
      await fetchTransactions(selectedYearId);
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  // Get transaction type badge
  const getTypeBadge = (type: string, isReimbursement: boolean) => {
    if (type === 'income') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">収入</span>;
    }
    if (isReimbursement) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">立替</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">支出</span>;
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
        <h1 className="text-3xl font-bold text-gray-900">入出金管理</h1>
        <p className="mt-2 text-gray-600">年度ごとの収支記録と管理を行います</p>
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
          {/* Financial Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総収入</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ¥{summary.totalIncome.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  会費: ¥{summary.feeIncome.toLocaleString()} | その他: ¥{summary.otherIncome.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">総支出</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  ¥{summary.totalExpense.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  通常: ¥{summary.regularExpense.toLocaleString()} | 立替: ¥{summary.reimbursementExpense.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">収支</CardTitle>
                <DollarSign className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ¥{summary.balance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {summary.balance >= 0 ? '黒字' : '赤字'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">取引数</CardTitle>
                <Receipt className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  件の取引記録
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                {editingId ? '取引編集' : '新しい取引を記録'}
              </CardTitle>
              <CardDescription>
                収入・支出の取引情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>取引種別</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="income">収入</SelectItem>
                              <SelectItem value="expense">支出</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>金額（円）</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="transaction_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>取引日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchType === 'expense' && (
                      <FormField
                        control={form.control}
                        name="is_reimbursement"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">立替</FormLabel>
                              <FormDescription className="text-xs">
                                立替支出の場合
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
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>内容・説明</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="取引の内容や説明を入力してください"
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

          {/* Transactions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                取引一覧
              </CardTitle>
              <CardDescription>
                登録済みの取引記録（{transactions.length}件）
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>取引日</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transaction_date), 'yyyy/MM/dd')}
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(transaction.type, transaction.is_reimbursement)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}¥{transaction.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEdit(transaction)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteTransaction(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {transactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この年度の取引記録がありません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}