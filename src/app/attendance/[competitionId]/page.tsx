'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  Trophy, MapPin, Clock, Users, MessageSquare, 
  CheckCircle, XCircle, AlertCircle, CalendarDays 
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
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
import { attendanceFormSchema } from '@/lib/validations';
import { AttendanceFormData, AttendanceStatus, CompetitionWithAttendances, MemberAttendanceData } from '@/types/attendance';

const ATTENDANCE_OPTIONS: { value: AttendanceStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { value: '〇', label: '参加', icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-600' },
  { value: '×', label: '不参加', icon: <XCircle className="h-4 w-4" />, color: 'text-red-600' },
  { value: '△', label: '未定', icon: <AlertCircle className="h-4 w-4" />, color: 'text-yellow-600' },
];

export default function AttendancePage() {
  const params = useParams();
  const competitionId = params.competitionId as string;

  const [competition, setCompetition] = useState<CompetitionWithAttendances | null>(null);
  const [members, setMembers] = useState<MemberAttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const form = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      competition_id: competitionId,
      member_id: '',
      golf_attendance: undefined,
      golf_comment: '',
      celebration_attendance: undefined,
      celebration_comment: '',
    },
  });

  // Fetch competition and attendance data
  const fetchCompetitionData = useCallback(async () => {
    try {
      // Get competition details
      const { data: competitionData, error: competitionError } = await supabase
        .from(DB_TABLES.COMPETITIONS)
        .select(`
          *,
          years!inner(name)
        `)
        .eq('id', competitionId)
        .single();

      if (competitionError) throw competitionError;
      if (!competitionData) throw new Error('コンペが見つかりません');

      // Get all active members
      const { data: membersData, error: membersError } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (membersError) throw membersError;

      // Get existing attendances for this competition
      const { data: attendancesData, error: attendancesError } = await supabase
        .from(DB_TABLES.COMPETITION_ATTENDANCES)
        .select('*')
        .eq('competition_id', competitionId);

      if (attendancesError) throw attendancesError;

      // Combine member and attendance data
      const membersWithAttendance: MemberAttendanceData[] = (membersData || []).map(member => {
        const attendance = (attendancesData || []).find(a => a.member_id === member.id);
        return {
          member: {
            id: member.id,
            name: member.name,
            member_type: member.member_type,
          },
          attendance: attendance || undefined,
        };
      });

      setCompetition({
        ...competitionData,
        year: competitionData.years,
        attendances: membersWithAttendance,
      });
      setMembers(membersWithAttendance);

    } catch (error) {
      console.error('Error fetching competition data:', error);
    } finally {
      setLoading(false);
    }
  }, [competitionId]);

  useEffect(() => {
    if (competitionId) {
      fetchCompetitionData();
    }
  }, [competitionId, fetchCompetitionData]);

  // Handle member selection
  const handleMemberSelect = (memberId: string) => {
    setSelectedMember(memberId);
    const memberData = members.find(m => m.member.id === memberId);
    
    form.reset({
      competition_id: competitionId,
      member_id: memberId,
      golf_attendance: memberData?.attendance?.golf_attendance || undefined,
      golf_comment: memberData?.attendance?.golf_comment || '',
      celebration_attendance: memberData?.attendance?.celebration_attendance || undefined,
      celebration_comment: memberData?.attendance?.celebration_comment || '',
    });
  };

  // Submit attendance
  const onSubmit = async (data: AttendanceFormData) => {
    setSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const { error } = await supabase
        .from(DB_TABLES.COMPETITION_ATTENDANCES)
        .upsert([data], { onConflict: 'competition_id,member_id' });

      if (error) throw error;

      // Show success message
      setSuccessMessage('出欠情報を登録しました');

      // Refresh data
      await fetchCompetitionData();

      // Reset form
      form.reset({
        competition_id: competitionId,
        member_id: '',
        golf_attendance: undefined,
        golf_comment: '',
        celebration_attendance: undefined,
        celebration_comment: '',
      });
      setSelectedMember('');

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (error) {
      console.error('Error submitting attendance:', error);
      setErrorMessage('出欠情報の登録に失敗しました。もう一度お試しください。');

      // Clear error message after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Get attendance icon and color
  const getAttendanceDisplay = (status?: AttendanceStatus) => {
    const option = ATTENDANCE_OPTIONS.find(opt => opt.value === status);
    if (!option) return { icon: <span>-</span>, color: 'text-gray-400', label: '未回答' };
    return option;
  };

  // Get member type badge color
  const getBadgeColor = (memberType: string) => {
    switch (memberType) {
      case '会員': return 'bg-green-100 text-green-800';
      case '旧会員': return 'bg-gray-100 text-gray-800';
      case '配偶者': return 'bg-blue-100 text-blue-800';
      case 'ゲスト': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate attendance counts
  const getAttendanceCounts = (type: 'golf' | 'celebration') => {
    const counts = {
      '〇': 0, // 参加
      '×': 0, // 不参加
      '△': 0, // 未定
      '未回答': 0
    };

    members.forEach(memberData => {
      const status = type === 'golf' 
        ? memberData.attendance?.golf_attendance
        : memberData.attendance?.celebration_attendance;
      
      if (status) {
        counts[status]++;
      } else {
        counts['未回答']++;
      }
    });

    return counts;
  };

  const golfCounts = getAttendanceCounts('golf');
  const celebrationCounts = competition?.has_celebration ? getAttendanceCounts('celebration') : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p>指定されたコンペが見つかりません。</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Competition Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Trophy className="h-7 w-7 text-yellow-600" />
              {competition.name}
            </CardTitle>
            <CardDescription className="text-lg">{competition.title}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span>{competition.golf_course}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span>{format(new Date(competition.start_time), 'yyyy/MM/dd HH:mm')}</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-gray-400" />
                <span>{competition.year.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">参加費:</span>
                <span>¥{competition.fee.toLocaleString()}</span>
              </div>
            </div>

            {competition.rules && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">ルール・注意事項</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{competition.rules}</p>
              </div>
            )}

            {competition.has_celebration && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2 text-blue-900">祝賀会</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  {competition.celebration_venue && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{competition.celebration_venue}</span>
                    </div>
                  )}
                  {competition.celebration_start_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{format(new Date(competition.celebration_start_time), 'yyyy/MM/dd HH:mm')}</span>
                    </div>
                  )}
                  {competition.celebration_fee && (
                    <div className="flex items-center gap-2">
                      <span>会費: ¥{competition.celebration_fee.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                出欠登録・変更
              </CardTitle>
              <CardDescription>
                お名前を選択して出欠状況を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Success Message */}
              {successMessage && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">{successMessage}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">{errorMessage}</span>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="member_id"
                    render={() => (
                      <FormItem>
                        <FormLabel>お名前</FormLabel>
                        <Select onValueChange={handleMemberSelect} value={selectedMember}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="お名前を選択してください" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {members.map((member) => (
                              <SelectItem key={member.member.id} value={member.member.id}>
                                {member.member.name} ({member.member.member_type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedMember && (
                    <>
                      {/* Golf Attendance */}
                      <div className="space-y-4">
                        <h4 className="font-medium">ゴルフ出欠</h4>
                        <FormField
                          control={form.control}
                          name="golf_attendance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>出欠</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value || ''}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="出欠を選択" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ATTENDANCE_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      <div className="flex items-center gap-2">
                                        <span className={option.color}>{option.icon}</span>
                                        {option.label}
                                      </div>
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
                          name="golf_comment"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>コメント（任意）</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="連絡事項やコメントがあれば入力してください"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Celebration Attendance */}
                      {competition.has_celebration && (
                        <div className="space-y-4 border-t pt-4">
                          <h4 className="font-medium">祝賀会出欠</h4>
                          <FormField
                            control={form.control}
                            name="celebration_attendance"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>出欠</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="出欠を選択" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {ATTENDANCE_OPTIONS.map((option) => (
                                      <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                          <span className={option.color}>{option.icon}</span>
                                          {option.label}
                                        </div>
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
                            name="celebration_comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>コメント（任意）</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="連絡事項やコメントがあれば入力してください"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}

                      <Button type="submit" className="w-full" disabled={submitting}>
                        {submitting ? '送信中...' : '出欠を登録・更新'}
                      </Button>
                    </>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                出欠状況一覧
              </CardTitle>
              <CardDescription>
                現在の出欠状況（{members.length}名）
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Attendance Summary */}
              <div className="mb-6 space-y-4">
                {/* Golf Attendance Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    ゴルフ出欠集計
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{golfCounts['〇']}</div>
                      <div className="text-sm text-gray-600">参加</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{golfCounts['×']}</div>
                      <div className="text-sm text-gray-600">不参加</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{golfCounts['△']}</div>
                      <div className="text-sm text-gray-600">未定</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-500">{golfCounts['未回答']}</div>
                      <div className="text-sm text-gray-600">未回答</div>
                    </div>
                  </div>
                </div>

                {/* Celebration Attendance Summary */}
                {competition.has_celebration && celebrationCounts && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      祝賀会出欠集計
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{celebrationCounts['〇']}</div>
                        <div className="text-sm text-gray-600">参加</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{celebrationCounts['×']}</div>
                        <div className="text-sm text-gray-600">不参加</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">{celebrationCounts['△']}</div>
                        <div className="text-sm text-gray-600">未定</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-500">{celebrationCounts['未回答']}</div>
                        <div className="text-sm text-gray-600">未回答</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>氏名</TableHead>
                    <TableHead>区分</TableHead>
                    <TableHead>ゴルフ</TableHead>
                    {competition.has_celebration && <TableHead>祝賀会</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((memberData) => {
                    const golfDisplay = getAttendanceDisplay(memberData.attendance?.golf_attendance);
                    const celebrationDisplay = getAttendanceDisplay(memberData.attendance?.celebration_attendance);
                    
                    return (
                      <TableRow key={memberData.member.id}>
                        <TableCell className="font-medium">
                          {memberData.member.name}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(memberData.member.member_type)}`}>
                            {memberData.member.member_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={golfDisplay.color}>{golfDisplay.icon}</span>
                            <span className="text-sm">{golfDisplay.label}</span>
                          </div>
                          {memberData.attendance?.golf_comment && (
                            <div className="text-xs text-gray-500 mt-1">
                              {memberData.attendance.golf_comment}
                            </div>
                          )}
                        </TableCell>
                        {competition.has_celebration && (
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className={celebrationDisplay.color}>{celebrationDisplay.icon}</span>
                              <span className="text-sm">{celebrationDisplay.label}</span>
                            </div>
                            {memberData.attendance?.celebration_comment && (
                              <div className="text-xs text-gray-500 mt-1">
                                {memberData.attendance.celebration_comment}
                              </div>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}