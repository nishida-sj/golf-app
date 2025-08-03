// Celebration types for milestone age celebration management

export type CelebrationAge = 60 | 70 | 77 | 80;

export interface MemberCelebration {
  id: string;
  member_id: string;
  age: CelebrationAge;
  year_id: string;
  is_completed: boolean;
  completion_date?: string;
  notes?: string;
  created_at: string;
}

export interface CelebrationFormData {
  member_id: string;
  age: CelebrationAge;
  year_id: string;
  is_completed: boolean;
  completion_date?: string;
  notes?: string;
}

export interface MemberWithCelebrations {
  id: string;
  name: string;
  birth_date: string;
  member_type: string;
  is_active: boolean;
  current_age: number;
  upcoming_celebrations: {
    age: CelebrationAge;
    year_turning: number;
    is_this_year: boolean;
    is_past_due: boolean;
  }[];
  completed_celebrations: MemberCelebration[];
  pending_celebrations: {
    age: CelebrationAge;
    expected_year: number;
  }[];
}

export interface CelebrationSummary {
  total_members: number;
  this_year_celebrations: number;
  completed_this_year: number;
  pending_this_year: number;
  upcoming_celebrations: number;
}