// Attendance types for competition attendance management

export type AttendanceStatus = '〇' | '×' | '△';

export interface CompetitionAttendance {
  id: string;
  competition_id: string;
  member_id: string;
  golf_attendance?: AttendanceStatus;
  golf_comment?: string;
  celebration_attendance?: AttendanceStatus;
  celebration_comment?: string;
  submitted_at: string;
  updated_at: string;
}

export interface AttendanceFormData {
  competition_id: string;
  member_id: string;
  golf_attendance?: AttendanceStatus;
  golf_comment?: string;
  celebration_attendance?: AttendanceStatus;
  celebration_comment?: string;
}

export interface MemberAttendanceData {
  member: {
    id: string;
    name: string;
    member_type: string;
  };
  attendance?: CompetitionAttendance;
}

export interface CompetitionWithAttendances {
  id: string;
  name: string;
  golf_course: string;
  start_time: string;
  title: string;
  rules: string;
  fee: number;
  has_celebration: boolean;
  celebration_venue?: string;
  celebration_start_time?: string;
  celebration_fee?: number;
  year: {
    name: string;
  };
  attendances: MemberAttendanceData[];
}