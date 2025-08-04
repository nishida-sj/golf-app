'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DollarSign, Users, Calendar, Edit2, Check, X, Plus } from 'lucide-react';

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

  const getBadgeColor = (memberType: string) => {
    switch (memberType) {
      case '会員': return 'bg-green-100 text-green-800';
      case '旧会員': return 'bg-gray-100 text-gray-800';
      case '配偶者': return 'bg-blue-100 text-blue-800';
      case 'ゲスト': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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
                <form onSubmit={paymentForm.handleSubmit(onSubmitFeePayment)} className="space-y-4">
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
                  {memberPayments.map((member) => (
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

              {memberPayments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  アクティブな会員がいません
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}