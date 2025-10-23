import { NextRequest, NextResponse } from 'next/server';
import { supabase, DB_TABLES } from '@/lib/supabase';

interface RouteContext {
  params: Promise<{
    competitionId: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { competitionId } = await context.params;

    // 会員データを取得
    const { data: members, error: membersError } = await supabase
      .from(DB_TABLES.MEMBERS)
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (membersError) {
      throw membersError;
    }

    // 出欠データを取得
    const { data: attendances, error: attendancesError } = await supabase
      .from(DB_TABLES.COMPETITION_ATTENDANCES)
      .select('*')
      .eq('competition_id', competitionId);

    if (attendancesError) {
      throw attendancesError;
    }

    // コンペ情報を取得（祝賀会の有無を確認）
    const { data: competition, error: competitionError } = await supabase
      .from(DB_TABLES.COMPETITIONS)
      .select('has_celebration')
      .eq('id', competitionId)
      .single();

    if (competitionError) {
      throw competitionError;
    }

    // 会員データと出欠データをマージ
    const participantData = members.map(member => {
      const attendance = attendances?.find(a => a.member_id === member.id);

      return {
        name: member.name,
        birth_date: member.birth_date,
        member_type: member.member_type,
        golf_attendance: attendance?.golf_attendance || '',
        golf_comment: attendance?.golf_comment || '',
        celebration_attendance: attendance?.celebration_attendance || '',
        celebration_comment: attendance?.celebration_comment || '',
      };
    });

    return NextResponse.json({
      participants: participantData,
      has_celebration: competition.has_celebration,
    });
  } catch (error) {
    console.error('Error exporting participant data:', error);
    return NextResponse.json(
      { error: '参加者データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
