// Grouping types for competition group management

export interface CompetitionGroup {
  id: string;
  competition_id: string;
  group_number: number;
  start_time?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  member_id: string;
  position: number; // 1-4 for each group
  created_at: string;
}

export interface GroupWithMembers extends CompetitionGroup {
  members: Array<{
    id: string;
    member_id: string;
    position: number;
    member: {
      id: string;
      name: string;
      member_type: string;
    };
  }>;
}

export interface GroupFormData {
  competition_id: string;
  group_number: number;
  start_time?: string;
  notes?: string;
  member_ids: string[]; // Array of 4 member IDs
}

export interface MemberWithAttendance {
  id: string;
  name: string;
  member_type: string;
  attendance_status?: '〇' | '×' | '△';
  is_assigned: boolean;
}