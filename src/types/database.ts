// Database types for the golf club management app

export interface Year {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  name: string;
  birth_date: string;
  member_type: '会員' | '旧会員' | '配偶者' | 'ゲスト';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeeSetting {
  id: string;
  year_id: string;
  member_type: string;
  amount: number;
  created_at: string;
}

export interface FeePayment {
  id: string;
  year_id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  created_at: string;
}

// Joined types for convenience
export interface MemberWithAge extends Member {
  age: number;
}

export interface FeePaymentWithMember extends FeePayment {
  member: Member;
}

export interface MemberWithPaymentStatus extends Member {
  fee_payment?: FeePayment;
  expected_amount?: number;
  payment_status: 'paid' | 'unpaid';
  age: number;
}