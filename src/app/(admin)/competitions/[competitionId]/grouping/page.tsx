'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { 
  Users, Clock, ArrowLeft, Plus, Edit2, Trash2, 
  CheckCircle, XCircle, AlertCircle, Shuffle, ArrowUpDown
} from 'lucide-react';

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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { supabase, DB_TABLES } from '@/lib/supabase';
import { groupFormSchema, calculateAge } from '@/lib/validations';
import { Competition } from '@/types/competition';
import { GroupWithMembers, GroupFormData, MemberWithAttendance } from '@/types/grouping';

export default function CompetitionGroupingPage() {
  const params = useParams();
  const router = useRouter();
  const competitionId = params.competitionId as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [availableMembers, setAvailableMembers] = useState<MemberWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<GroupFormData>({
    resolver: zodResolver(groupFormSchema),
    defaultValues: {
      competition_id: competitionId,
      group_number: 1,
      start_time: '',
      notes: '',
      member_ids: [],
    },
  });

  // Fetch competition details
  const fetchCompetition = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(DB_TABLES.COMPETITIONS)
        .select('*')
        .eq('id', competitionId)
        .single();

      if (error) throw error;
      setCompetition(data);
    } catch (error) {
      console.error('Error fetching competition:', error);
      router.push('/competitions');
    }
  }, [competitionId, router]);

  // Fetch groups for this competition
  const fetchGroups = useCallback(async () => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from(DB_TABLES.COMPETITION_GROUPS)
        .select(`
          *,
          group_members!inner(
            id,
            member_id,
            position,
            members!inner(id, name, member_type)
          )
        `)
        .eq('competition_id', competitionId)
        .order('group_number');

      if (groupsError) throw groupsError;

      // Transform the data structure
      const groupsWithMembers: GroupWithMembers[] = (groupsData || []).map(group => ({
        ...group,
        members: group.group_members.map((gm: {
          id: string;
          member_id: string;
          position: number;
          members: { id: string; name: string; member_type: string; };
        }) => ({
          id: gm.id,
          member_id: gm.member_id,
          position: gm.position,
          member: gm.members,
        })).sort((a: { position: number }, b: { position: number }) => a.position - b.position),
      }));

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, [competitionId]);

  // Fetch available members (with attendance info)
  const fetchAvailableMembers = useCallback(async () => {
    try {
      // Get all active members
      const { data: membersData, error: membersError } = await supabase
        .from(DB_TABLES.MEMBERS)
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (membersError) throw membersError;

      // Get attendance data for this competition
      const { data: attendanceData, error: attendanceError } = await supabase
        .from(DB_TABLES.COMPETITION_ATTENDANCES)
        .select('member_id, golf_attendance')
        .eq('competition_id', competitionId);

      if (attendanceError) throw attendanceError;

      // Get assigned member IDs
      const assignedMemberIds = new Set(
        groups.flatMap(group => group.members.map(m => m.member_id))
      );

      // Combine data
      const membersWithAttendance: MemberWithAttendance[] = (membersData || []).map(member => {
        const attendance = (attendanceData || []).find(a => a.member_id === member.id);
        return {
          id: member.id,
          name: member.name,
          member_type: member.member_type,
          birth_date: member.birth_date,
          attendance_status: attendance?.golf_attendance,
          is_assigned: assignedMemberIds.has(member.id),
        };
      });

      setAvailableMembers(membersWithAttendance);
    } catch (error) {
      console.error('Error fetching available members:', error);
    }
  }, [competitionId, groups]);

  useEffect(() => {
    if (competitionId) {
      const initializeData = async () => {
        setLoading(true);
        await fetchCompetition();
        await fetchGroups();
        setLoading(false);
      };
      initializeData();
    }
  }, [competitionId, fetchCompetition, fetchGroups]);

  useEffect(() => {
    fetchAvailableMembers();
  }, [groups, fetchAvailableMembers]);

  // Get next group number
  const getNextGroupNumber = () => {
    if (groups.length === 0) return 1;
    return Math.max(...groups.map(g => g.group_number)) + 1;
  };

  // Submit group
  const onSubmit = async (data: GroupFormData) => {
    setSubmitting(true);
    try {
      if (editingId) {
        // Update existing group
        const { error: groupError } = await supabase
          .from(DB_TABLES.COMPETITION_GROUPS)
          .update({
            group_number: data.group_number,
            start_time: data.start_time || null,
            notes: data.notes || null,
          })
          .eq('id', editingId);

        if (groupError) throw groupError;

        // Delete existing group members
        const { error: deleteError } = await supabase
          .from(DB_TABLES.GROUP_MEMBERS)
          .delete()
          .eq('group_id', editingId);

        if (deleteError) throw deleteError;

        // Insert new group members
        const memberInserts = data.member_ids.map((memberId, index) => ({
          group_id: editingId,
          member_id: memberId,
          position: index + 1,
        }));

        const { error: membersError } = await supabase
          .from(DB_TABLES.GROUP_MEMBERS)
          .insert(memberInserts);

        if (membersError) throw membersError;

      } else {
        // Create new group
        const { data: groupData, error: groupError } = await supabase
          .from(DB_TABLES.COMPETITION_GROUPS)
          .insert([{
            competition_id: data.competition_id,
            group_number: data.group_number,
            start_time: data.start_time || null,
            notes: data.notes || null,
          }])
          .select()
          .single();

        if (groupError) throw groupError;

        // Insert group members
        const memberInserts = data.member_ids.map((memberId, index) => ({
          group_id: groupData.id,
          member_id: memberId,
          position: index + 1,
        }));

        const { error: membersError } = await supabase
          .from(DB_TABLES.GROUP_MEMBERS)
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      resetForm();
      await fetchGroups();
    } catch (error) {
      console.error('Error saving group:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    form.reset({
      competition_id: competitionId,
      group_number: getNextGroupNumber(),
      start_time: '',
      notes: '',
      member_ids: [],
    });
  };

  // Start editing
  const startEdit = (group: GroupWithMembers) => {
    setEditingId(group.id);
    form.reset({
      competition_id: competitionId,
      group_number: group.group_number,
      start_time: group.start_time || '',
      notes: group.notes || '',
      member_ids: group.members.map(m => m.member_id),
    });
  };

  // Delete group
  const deleteGroup = async (groupId: string) => {
    if (!confirm('この組を削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      // Delete group members first (cascade should handle this, but being explicit)
      await supabase
        .from(DB_TABLES.GROUP_MEMBERS)
        .delete()
        .eq('group_id', groupId);

      // Delete group
      const { error } = await supabase
        .from(DB_TABLES.COMPETITION_GROUPS)
        .delete()
        .eq('id', groupId);

      if (error) throw error;
      await fetchGroups();
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // Auto-assign members randomly
  const autoAssignMembers = async () => {
    if (!confirm('参加予定者を自動で組み分けしますか？既存の組は削除されます。')) {
      return;
    }

    try {
      // Delete all existing groups
      for (const group of groups) {
        await supabase.from(DB_TABLES.GROUP_MEMBERS).delete().eq('group_id', group.id);
        await supabase.from(DB_TABLES.COMPETITION_GROUPS).delete().eq('id', group.id);
      }

      // Get participating members (those who answered 〇)
      const participatingMembers = availableMembers.filter(m => m.attendance_status === '〇');
      
      if (participatingMembers.length === 0) {
        alert('参加予定者がいません。');
        return;
      }

      // Shuffle members randomly first
      const shuffledMembers = [...participatingMembers].sort(() => Math.random() - 0.5);
      
      // Create groups of 4
      const groupsToCreate = [];
      for (let i = 0; i < shuffledMembers.length; i += 4) {
        const groupMembers = shuffledMembers.slice(i, i + 4);
        // Sort each group by age descending (oldest first)
        const sortedGroupMembers = groupMembers.sort((a, b) => {
          const ageA = calculateAge(a.birth_date);
          const ageB = calculateAge(b.birth_date);
          return ageB - ageA; // Descending order
        });
        groupsToCreate.push(sortedGroupMembers);
      }

      // Create groups in database
      for (let i = 0; i < groupsToCreate.length; i++) {
        const groupNumber = i + 1;
        const members = groupsToCreate[i];

        // Create group
        const { data: groupData, error: groupError } = await supabase
          .from(DB_TABLES.COMPETITION_GROUPS)
          .insert([{
            competition_id: competitionId,
            group_number: groupNumber,
          }])
          .select()
          .single();

        if (groupError) throw groupError;

        // Add members to group
        const memberInserts = members.map((member, index) => ({
          group_id: groupData.id,
          member_id: member.id,
          position: index + 1,
        }));

        const { error: membersError } = await supabase
          .from(DB_TABLES.GROUP_MEMBERS)
          .insert(memberInserts);

        if (membersError) throw membersError;
      }

      await fetchGroups();
      alert(`${groupsToCreate.length}組に自動分けしました。`);
    } catch (error) {
      console.error('Error auto-assigning members:', error);
      alert('自動組み分けに失敗しました。');
    }
  };

  // Get attendance icon
  const getAttendanceIcon = (status?: '〇' | '×' | '△') => {
    switch (status) {
      case '〇': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case '×': return <XCircle className="h-4 w-4 text-red-600" />;
      case '△': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <span className="h-4 w-4 text-gray-400">-</span>;
    }
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

  // Sort group members by age descending
  const sortGroupByAge = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      // Get member details with birth dates
      const memberIds = group.members.map(m => m.member_id);
      const membersWithBirthDate = availableMembers.filter(m => memberIds.includes(m.id));
      
      // Sort by age descending
      const sortedMembers = membersWithBirthDate.sort((a, b) => {
        const ageA = calculateAge(a.birth_date);
        const ageB = calculateAge(b.birth_date);
        return ageB - ageA; // Descending order
      });

      // Delete existing group members
      const { error: deleteError } = await supabase
        .from(DB_TABLES.GROUP_MEMBERS)
        .delete()
        .eq('group_id', groupId);

      if (deleteError) throw deleteError;

      // Insert sorted members
      const memberInserts = sortedMembers.map((member, index) => ({
        group_id: groupId,
        member_id: member.id,
        position: index + 1,
      }));

      const { error: insertError } = await supabase
        .from(DB_TABLES.GROUP_MEMBERS)
        .insert(memberInserts);

      if (insertError) throw insertError;

      await fetchGroups();
    } catch (error) {
      console.error('Error sorting group by age:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>読み込み中...</p>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>コンペが見つかりません</p>
      </div>
    );
  }

  const participatingMembers = availableMembers.filter(m => m.attendance_status === '〇');
  const unassignedParticipants = participatingMembers.filter(m => !m.is_assigned);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          戻る
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">組み合わせ表</h1>
          <p className="mt-1 text-gray-600">{competition.name}</p>
        </div>
      </div>

      {/* Competition Info */}
      <Card>
        <CardHeader>
          <CardTitle>{competition.name}</CardTitle>
          <CardDescription>
            {format(new Date(competition.start_time), 'yyyy年MM月dd日 HH:mm')} @ {competition.golf_course}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div>参加予定: {participatingMembers.length}名</div>
            <div>未組み分け: {unassignedParticipants.length}名</div>
            <div>組数: {groups.length}組</div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Assignment */}
      {participatingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shuffle className="h-5 w-5" />
              自動組み分け
            </CardTitle>
            <CardDescription>
              参加予定者（{participatingMembers.length}名）を自動で組み分けします
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={autoAssignMembers} variant="outline">
              <Shuffle className="h-4 w-4 mr-2" />
              自動組み分け実行
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Group Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingId ? '組編集' : '新しい組を作成'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="group_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>組番号</FormLabel>
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
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>スタート時間（任意）</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>備考（任意）</FormLabel>
                      <FormControl>
                        <Input placeholder="備考" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="member_ids"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>メンバー選択（最大4名）</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {[0, 1, 2, 3].map((position) => (
                        <Select
                          key={`form-select-${position}`}
                          onValueChange={(value) => {
                            const newMemberIds = [...field.value];
                            if (value === '__EMPTY__') {
                              newMemberIds.splice(position, 1);
                            } else {
                              newMemberIds[position] = value;
                            }
                            // Remove duplicates
                            const uniqueIds = newMemberIds.filter((id, index) => 
                              newMemberIds.indexOf(id) === index
                            );
                            field.onChange(uniqueIds);
                          }}
                          value={field.value[position] || '__EMPTY__'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={`${position + 1}番目`} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__EMPTY__">選択解除</SelectItem>
                            {availableMembers
                              .filter(m => !field.value.includes(m.id) || field.value[position] === m.id)
                              .map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center gap-2">
                                    {getAttendanceIcon(member.attendance_status)}
                                    <span>{member.name}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${getBadgeColor(member.member_type)}`}>
                                      {member.member_type}
                                    </span>
                                    {member.is_assigned && !editingId && (
                                      <span className="text-xs text-orange-600">(済)</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex space-x-4">
                <Button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : (editingId ? '更新' : '作成')}
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

      {/* Groups List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            組み合わせ一覧（{groups.length}組）
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-medium">{group.group_number}組</h3>
                    {group.start_time && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        {group.start_time}
                      </div>
                    )}
                    {group.notes && (
                      <span className="text-sm text-gray-600">({group.notes})</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => sortGroupByAge(group.id)}
                      title="年齢降順で並び替え"
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => startEdit(group)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteGroup(group.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[1, 2, 3, 4].map((position) => {
                    const member = group.members.find(m => m.position === position);
                    const memberData = member ? availableMembers.find(am => am.id === member.member_id) : null;
                    
                    return (
                      <div key={`${group.id}-${position}`} className="p-3 border rounded-lg bg-gray-50">
                        {member && memberData ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              {getAttendanceIcon(memberData.attendance_status)}
                              <span className="font-medium">{memberData.name}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {calculateAge(memberData.birth_date)}歳
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeColor(memberData.member_type)}`}>
                              {memberData.member_type}
                            </span>
                          </div>
                        ) : (
                          <div className="text-gray-400 text-center py-2">
                            空き
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {groups.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              まだ組が作成されていません
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unassigned Participants */}
      {unassignedParticipants.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              未組み分けの参加者（{unassignedParticipants.length}名）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unassignedParticipants.map((member) => (
                <div key={member.id} className="bg-white p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    {getAttendanceIcon(member.attendance_status)}
                    <span className="font-medium">{member.name}</span>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getBadgeColor(member.member_type)}`}>
                    {member.member_type}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}