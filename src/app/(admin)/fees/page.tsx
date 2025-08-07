'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DollarSign, Users, Calendar, Edit2, Check, X, Plus, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { feeSettingFormSchema, feePaymentFormSchema } from '@/lib/validations';
import { Year, Member, FeeSetting, MemberWithPaymentStatus } from '@/types/database';
import { MemberType, FeeSettingFormData, FeePaymentFormData } from '@/types/common';

const MEMBER_TYPES: MemberType[] = ['会員', '旧会員', '配偶者', 'ゲスト'];

interface FeeSettingWithEditing extends FeeSetting {
  isEditing?: boolean;
  tempAmount?: number;
}

export default function FeesPage() {
  const [years, setYears] = useState<Year[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [feeSettings, setFeeSettings] = useState<FeeSettingWithEditing[]>([]);
  const [memberPayments, setMemberPayments] = useState<MemberWithPaymentStatus[]>([]);
  const [loading, setLoading] = useState(true);

  // Fee Setting Form
  const settingForm = useForm<FeeSettingFormData>({
    resolver: zodResolver(feeSettingFormSchema),
    defaultValues: {
      year_id: '',
      member_type: '会員',
      amount: 5000,
    },
  });

  // Fee Payment Form
  const paymentForm = useForm<FeePaymentFormData>({
    resolver: zodResolver(feePaymentFormSchema),
    defaultValues: {
      year_id: '',
      member_id: '',
      amount: 0,
      payment_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  // Fetch initial data
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
        settingForm.setValue('year_id', activeYear.id);
        paymentForm.setValue('year_id', activeYear.id);
      }
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  }, []);

  const fetchMembers = useCallback(async () => {
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
  }, []);

  const fetchFeeSettings = async (yearId: string) => {
    if (!yearId) return;

    try {
      const { data, error } = await supabase
        .from(DB_TABLES.FEE_SETTINGS)
        .select('*')
        .eq('year_id', yearId);

      if (error) throw error;
      setFeeSettings(data || []);
    } catch (error) {
      console.error('Error fetching fee settings:', error);
    }
  };

  const fetchMemberPayments = async (yearId: string) => {
    if (!yearId) return;

    try {
      // Get all active members with their payment info
      const { data: membersData, error: membersError } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select(`
          *,
          fee_payments!inner(
            id,
            amount,
            payment_date,
            year_id
          )
        `)
        .eq('is_active', true)
        .eq('fee_payments.year_id', yearId);

      if (membersError) throw membersError;

      // Get members without payments
      const { data: allMembers, error: allMembersError } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select('*')
        .eq('is_active', true);

      if (allMembersError) throw allMembersError;

      // Get fee settings for this year
      const { data: settingsData, error: settingsError } = await supabase
        .from(DB_TABLES.FEE_SETTINGS)
        .select('*')
        .eq('year_id', yearId);

      if (settingsError) throw settingsError;

      // Combine data
      const memberPaymentsList: MemberWithPaymentStatus[] = (allMembers || []).map(member => {
        const paymentData = (membersData || []).find(m => m.id === member.id);
        const expectedSetting = (settingsData || []).find(s => s.member_type === member.member_type);
        
        return {
          ...member,
          fee_payment: paymentData?.fee_payments?.[0] || undefined,
          expected_amount: expectedSetting?.amount || 0,
          payment_status: paymentData ? 'paid' : 'unpaid',
          age: new Date().getFullYear() - new Date(member.birth_date).getFullYear(),
        };
      });

      setMemberPayments(memberPaymentsList);
    } catch (error) {
      console.error('Error fetching member payments:', error);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      await Promise.all([fetchYears(), fetchMembers()]);
      setLoading(false);
    };
    initializeData();
  }, [fetchYears, fetchMembers]);

  useEffect(() => {
    if (selectedYearId) {
      fetchFeeSettings(selectedYearId);
      fetchMemberPayments(selectedYearId);
    }
  }, [selectedYearId]);

  // Handle year selection change
  const handleYearChange = (yearId: string) => {
    setSelectedYearId(yearId);
    settingForm.setValue('year_id', yearId);
    paymentForm.setValue('year_id', yearId);
  };

  // Fee Settings Functions
  const onSubmitFeeSetting = async (data: FeeSettingFormData) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.FEE_SETTINGS)
        .upsert([data], { onConflict: 'year_id,member_type' });

      if (error) throw error;
      
      settingForm.reset({
        year_id: selectedYearId,
        member_type: '会員',
        amount: 5000,
      });
      
      await fetchFeeSettings(selectedYearId);
    } catch (error) {
      console.error('Error saving fee setting:', error);
    }
  };

  const startEditFeeSetting = (settingId: string) => {
    setFeeSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, isEditing: true, tempAmount: setting.amount }
        : setting
    ));
  };

  const saveEditFeeSetting = async (settingId: string) => {
    const setting = feeSettings.find(s => s.id === settingId);
    if (!setting || setting.tempAmount === undefined) return;

    try {
      const { error } = await supabase
        .from(DB_TABLES.FEE_SETTINGS)
        .update({ amount: setting.tempAmount })
        .eq('id', settingId);

      if (error) throw error;
      await fetchFeeSettings(selectedYearId);
    } catch (error) {
      console.error('Error updating fee setting:', error);
    }
  };

  const cancelEditFeeSetting = (settingId: string) => {
    setFeeSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, isEditing: false, tempAmount: undefined }
        : setting
    ));
  };

  const updateTempAmount = (settingId: string, amount: number) => {
    setFeeSettings(prev => prev.map(setting => 
      setting.id === settingId 
        ? { ...setting, tempAmount: amount }
        : setting
    ));
  };

  // Fee Payment Functions
  const onSubmitFeePayment = async (data: FeePaymentFormData) => {
    try {
      const { error } = await supabase
        .from(DB_TABLES.FEE_PAYMENTS)
        .upsert([data], { onConflict: 'year_id,member_id' });

      if (error) throw error;
      
      paymentForm.reset({
        year_id: selectedYearId,
        member_id: '',
        amount: 0,
        payment_date: format(new Date(), 'yyyy-MM-dd'),
      });
      
      await fetchMemberPayments(selectedYearId);
    } catch (error) {
      console.error('Error saving fee payment:', error);
    }
  };

  const handleMemberSelect = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const expectedSetting = feeSettings.find(s => s.member_type === member.member_type);
      paymentForm.setValue('member_id', memberId);
      paymentForm.setValue('amount', expectedSetting?.amount || 0);
    }
  };

  // Handle unpaid member click to auto-select in payment form
  const handleUnpaidMemberClick = (member: MemberWithPaymentStatus) => {
    paymentForm.setValue('member_id', member.id);
    paymentForm.setValue('amount', member.expected_amount || 0);
    
    // Scroll to the payment form
    const paymentFormElement = document.getElementById('payment-form');
    if (paymentFormElement) {
      paymentFormElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getBadgeColor = (memberType: string) => {
    switch (memberType) {
      case '会員': return 'bg-green-100 text-green-800';
      case '旧会員': return 'bg-gray-100 text-gray-800';
      case '配偶者': return 'bg-blue-100 text-blue-800';
      case 'ゲスト': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate payment statistics
  const getPaymentStats = () => {
    // Filter out guests and former members who don't need to pay fees
    const feeRequiredMembers = memberPayments.filter(m => 
      m.member_type !== 'ゲスト' && m.member_type !== '旧会員'
    );
    
    const paidMembers = feeRequiredMembers.filter(m => m.payment_status === 'paid');
    const unpaidMembers = feeRequiredMembers.filter(m => m.payment_status === 'unpaid');
    const totalMembers = feeRequiredMembers.length;
    const paidAmount = paidMembers.reduce((sum, m) => sum + (m.fee_payment?.amount || 0), 0);
    const expectedAmount = feeRequiredMembers.reduce((sum, m) => sum + (m.expected_amount || 0), 0);
    const paymentRate = totalMembers > 0 ? (paidMembers.length / totalMembers) * 100 : 0;
    
    return {
      paidCount: paidMembers.length,
      unpaidCount: unpaidMembers.length,
      totalCount: totalMembers,
      paidAmount,
      expectedAmount,
      paymentRate,
      paidMembers,
      unpaidMembers
    };
  };

  // Get payment summary by date
  const getPaymentsByDate = () => {
    const feeRequiredMembers = memberPayments.filter(m => 
      m.member_type !== 'ゲスト' && m.member_type !== '旧会員'
    );
    
    const paidMembers = feeRequiredMembers.filter(m => m.payment_status === 'paid');
    const paymentsByDate: { [key: string]: { amount: number; count: number; members: string[] } } = {};
    
    paidMembers.forEach(member => {
      if (member.fee_payment) {
        const date = member.fee_payment.payment_date;
        if (!paymentsByDate[date]) {
          paymentsByDate[date] = { amount: 0, count: 0, members: [] };
        }
        paymentsByDate[date].amount += member.fee_payment.amount;
        paymentsByDate[date].count += 1;
        paymentsByDate[date].members.push(member.name);
      }
    });
    
    // Convert to array and sort by date descending
    return Object.entries(paymentsByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
        <h1 className="text-3xl font-bold text-gray-900">会費管理</h1>
        <p className="mt-2 text-gray-600">年度ごとの会費設定と支払い状況を管理します</p>
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
          {/* Payment Overview Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                支払い状況概要
              </CardTitle>
              <CardDescription>選択した年度の会費支払い状況の概要です</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const stats = getPaymentStats();
                return (
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="border-green-200 bg-green-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-600" />
                            <div>
                              <div className="text-2xl font-bold text-green-700">{stats.paidCount}</div>
                              <div className="text-sm text-green-600">支払い済み</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-red-200 bg-red-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-600" />
                            <div>
                              <div className="text-2xl font-bold text-red-700">{stats.unpaidCount}</div>
                              <div className="text-sm text-red-600">未払い</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div>
                              <div className="text-2xl font-bold text-blue-700">{stats.totalCount}</div>
                              <div className="text-sm text-blue-600">総会員数</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-gray-200 bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-gray-600" />
                            <div>
                              <div className="text-2xl font-bold text-gray-700">{stats.paymentRate.toFixed(1)}%</div>
                              <div className="text-sm text-gray-600">徴収率</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>支払い進捗</span>
                        <span>{stats.paidCount}/{stats.totalCount} 人</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-green-600 h-3 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${stats.paymentRate}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Amount Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          ¥{stats.paidAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">徴収済み額</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-600">
                          ¥{stats.expectedAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">予定総額</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-orange-600">
                          ¥{(stats.expectedAmount - stats.paidAmount).toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">未収額</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Detailed Payment Status Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Paid Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  支払済み会員一覧
                </CardTitle>
                <CardDescription>
                  会費を支払った会員の詳細情報
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const { paidMembers } = getPaymentStats();
                  return (
                    <div className="space-y-3">
                      {paidMembers.length > 0 ? (
                        <>
                          <div className="text-sm text-gray-600 mb-4">
                            {paidMembers.length}名が支払い完了
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {paidMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium text-green-900">{member.name}</div>
                                    <div className="text-sm text-green-700">
                                      {member.member_type} • {member.age}歳
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-green-700">
                                    ¥{member.fee_payment?.amount.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-green-600">
                                    {member.fee_payment && format(new Date(member.fee_payment.payment_date), 'MM/dd')}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          まだ支払いを行った会員がいません
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Unpaid Members Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  未払い会員一覧
                </CardTitle>
                <CardDescription>
                  会費の支払いが必要な会員の詳細情報（クリックで支払いフォームに追加）
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const { unpaidMembers } = getPaymentStats();
                  return (
                    <div className="space-y-3">
                      {unpaidMembers.length > 0 ? (
                        <>
                          <div className="text-sm text-gray-600 mb-4">
                            {unpaidMembers.length}名が支払い未完了
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-2">
                            {unpaidMembers.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 cursor-pointer hover:bg-red-100 transition-colors duration-200"
                                onClick={() => handleUnpaidMemberClick(member)}
                                title="クリックして支払いフォームに追加"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium text-red-900">{member.name}</div>
                                    <div className="text-sm text-red-700">
                                      {member.member_type} • {member.age}歳
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-semibold text-red-700">
                                    ¥{member.expected_amount?.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-red-600">予定額</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8 text-green-500">
                          全ての会員が支払い完了！
                        </div>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Payment Summary by Date */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                支払日別集計
              </CardTitle>
              <CardDescription>
                日付ごとの支払い実績と金額の集計
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const paymentsByDate = getPaymentsByDate();
                return (
                  <div className="space-y-4">
                    {paymentsByDate.length > 0 ? (
                      <div className="max-h-80 overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>支払日</TableHead>
                              <TableHead className="text-center">人数</TableHead>
                              <TableHead className="text-right">金額</TableHead>
                              <TableHead>支払者</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentsByDate.map((payment) => (
                              <TableRow key={payment.date}>
                                <TableCell className="font-medium">
                                  {format(new Date(payment.date), 'yyyy年MM月dd日')}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {payment.count}名
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-semibold">
                                  ¥{payment.amount.toLocaleString()}
                                </TableCell>
                                <TableCell className="max-w-xs">
                                  <div className="text-sm text-gray-600 truncate" title={payment.members.join(', ')}>
                                    {payment.members.join(', ')}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-gray-50 font-semibold">
                              <TableCell>合計</TableCell>
                              <TableCell className="text-center">
                                {paymentsByDate.reduce((sum, p) => sum + p.count, 0)}名
                              </TableCell>
                              <TableCell className="text-right">
                                ¥{paymentsByDate.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                              </TableCell>
                              <TableCell>-</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        まだ支払い実績がありません
                      </div>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Fee Settings Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                会費設定
              </CardTitle>
              <CardDescription>会員区分ごとの会費額を設定します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fee Settings Form */}
              <Form {...settingForm}>
                <form onSubmit={settingForm.handleSubmit(onSubmitFeeSetting)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={settingForm.control}
                      name="member_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>会員区分</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
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
                    <FormField
                      control={settingForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>会費額（円）</FormLabel>
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
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        設定を保存
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>

              {/* Fee Settings Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会員区分</TableHead>
                    <TableHead>会費額</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeSettings.map((setting) => (
                    <TableRow key={setting.id}>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(setting.member_type)}`}>
                          {setting.member_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        {setting.isEditing ? (
                          <Input
                            type="number"
                            value={setting.tempAmount || 0}
                            onChange={(e) => updateTempAmount(setting.id, Number(e.target.value))}
                            className="w-32"
                          />
                        ) : (
                          `¥${setting.amount.toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {setting.isEditing ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => saveEditFeeSetting(setting.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelEditFeeSetting(setting.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEditFeeSetting(setting.id)}
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

              {feeSettings.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  この年度の会費設定がありません
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fee Payments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                会費徴収管理
              </CardTitle>
              <CardDescription>会員ごとの会費支払い状況を管理します</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fee Payment Form */}
              <Form {...paymentForm}>
                <form id="payment-form" onSubmit={paymentForm.handleSubmit(onSubmitFeePayment)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={paymentForm.control}
                      name="member_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>会員</FormLabel>
                          <Select onValueChange={handleMemberSelect} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="会員を選択" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.name} ({member.member_type})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>支払い額（円）</FormLabel>
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
                      control={paymentForm.control}
                      name="payment_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>支払日</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-end">
                      <Button type="submit" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        支払いを記録
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>

              {/* Member Payments Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>会員区分</TableHead>
                    <TableHead>予定額</TableHead>
                    <TableHead>支払い額</TableHead>
                    <TableHead>支払日</TableHead>
                    <TableHead>ステータス</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberPayments
                    .filter(m => m.member_type !== 'ゲスト' && m.member_type !== '旧会員')
                    .map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(member.member_type)}`}>
                            {member.member_type}
                          </span>
                        </TableCell>
                        <TableCell>¥{member.expected_amount?.toLocaleString() || 0}</TableCell>
                        <TableCell>
                          {member.fee_payment 
                            ? `¥${member.fee_payment.amount.toLocaleString()}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {member.fee_payment 
                            ? format(new Date(member.fee_payment.payment_date), 'yyyy-MM-dd')
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {member.payment_status === 'paid' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              支払済
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              未収
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>

              {memberPayments.filter(m => m.member_type !== 'ゲスト' && m.member_type !== '旧会員').length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  会費対象の会員がいません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}