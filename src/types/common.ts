// Common types for the application

export type MemberType = '会員' | '旧会員' | '配偶者' | 'ゲスト';

export type PaymentStatus = 'paid' | 'unpaid';

export type AttendanceStatus = '〇' | '×' | '△';

// Form types
export interface YearFormData {
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface MemberFormData {
  name: string;
  birth_date: string;
  member_type: MemberType;
  is_active: boolean;
}

export interface FeeSettingFormData {
  year_id: string;
  member_type: MemberType;
  amount: number;
}

export interface FeePaymentFormData {
  year_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
}