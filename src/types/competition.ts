// Competition types for the golf club management app

export interface Competition {
  id: string;
  year_id: string;
  name: string;
  golf_course: string;
  start_time: string;
  title: string;
  rules: string;
  fee: number;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  has_celebration: boolean;
  celebration_venue?: string;
  celebration_start_time?: string;
  celebration_fee?: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitionFormData {
  year_id: string;
  name: string;
  golf_course: string;
  start_time: string;
  title: string;
  rules: string;
  fee: number;
  custom_field_1?: string;
  custom_field_2?: string;
  custom_field_3?: string;
  has_celebration: boolean;
  celebration_venue?: string;
  celebration_start_time?: string;
  celebration_fee?: number;
}

export interface CompetitionWithYear extends Competition {
  year: {
    name: string;
  };
}