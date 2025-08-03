import { z } from "zod";
import { MemberType } from "@/types/common";

// Year form validation
export const yearFormSchema = z.object({
  name: z.string().min(1, "年度名は必須です"),
  start_date: z.string().min(1, "開始日は必須です"),
  end_date: z.string().min(1, "終了日は必須です"),
  is_active: z.boolean().default(false),
});

// Member form validation
export const memberFormSchema = z.object({
  name: z.string().min(1, "氏名は必須です").max(100, "氏名は100文字以内で入力してください"),
  birth_date: z.string().min(1, "生年月日は必須です"),
  member_type: z.enum(['会員', '旧会員', '配偶者', 'ゲスト'] as const, {
    required_error: "会員区分を選択してください",
  }),
  is_active: z.boolean().default(true),
});

// Fee setting form validation
export const feeSettingFormSchema = z.object({
  year_id: z.string().min(1, "年度を選択してください"),
  member_type: z.enum(['会員', '旧会員', '配偶者', 'ゲスト'] as const, {
    required_error: "会員区分を選択してください",
  }),
  amount: z.number().min(0, "金額は0以上で入力してください"),
});

// Fee payment form validation
export const feePaymentFormSchema = z.object({
  year_id: z.string().min(1, "年度を選択してください"),
  member_id: z.string().min(1, "会員を選択してください"),
  amount: z.number().min(0, "金額は0以上で入力してください"),
  payment_date: z.string().min(1, "支払日は必須です"),
});

// Utility function to calculate age
export const calculateAge = (birthDate: string): number => {
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// Competition form validation
export const competitionFormSchema = z.object({
  year_id: z.string().min(1, "年度を選択してください"),
  name: z.string().min(1, "コンペ名は必須です").max(100, "コンペ名は100文字以内で入力してください"),
  golf_course: z.string().min(1, "ゴルフ場名は必須です").max(100, "ゴルフ場名は100文字以内で入力してください"),
  start_time: z.string().min(1, "開始時間は必須です"),
  title: z.string().min(1, "タイトルは必須です").max(200, "タイトルは200文字以内で入力してください"),
  rules: z.string().min(1, "ルールは必須です"),
  fee: z.number().min(0, "会費は0以上で入力してください"),
  custom_field_1: z.string().max(100, "100文字以内で入力してください").optional(),
  custom_field_2: z.string().max(100, "100文字以内で入力してください").optional(),
  custom_field_3: z.string().max(100, "100文字以内で入力してください").optional(),
  has_celebration: z.boolean().default(false),
  celebration_venue: z.string().max(100, "会場名は100文字以内で入力してください").optional(),
  celebration_start_time: z.string().optional(),
  celebration_fee: z.number().min(0, "会費は0以上で入力してください").optional(),
});

// Attendance form validation
export const attendanceFormSchema = z.object({
  competition_id: z.string().min(1, "コンペIDが必要です"),
  member_id: z.string().min(1, "会員IDが必要です"),
  golf_attendance: z.enum(['〇', '×', '△'] as const).optional(),
  golf_comment: z.string().max(200, "コメントは200文字以内で入力してください").optional(),
  celebration_attendance: z.enum(['〇', '×', '△'] as const).optional(),
  celebration_comment: z.string().max(200, "コメントは200文字以内で入力してください").optional(),
});

// Transaction form validation
export const transactionFormSchema = z.object({
  year_id: z.string().min(1, "年度を選択してください"),
  type: z.enum(['income', 'expense'] as const, {
    required_error: "取引種別を選択してください",
  }),
  amount: z.number().min(1, "金額は1円以上で入力してください").max(10000000, "金額は1000万円以下で入力してください"),
  description: z.string().min(1, "内容は必須です").max(200, "内容は200文字以内で入力してください"),
  transaction_date: z.string().min(1, "取引日は必須です"),
  is_reimbursement: z.boolean().default(false),
});

// Celebration form validation
export const celebrationFormSchema = z.object({
  member_id: z.string().min(1, "会員を選択してください"),
  age: z.number().refine((val) => [60, 70, 77, 80].includes(val), {
    message: "年齢は60、70、77、80のいずれかを選択してください",
  }),
  year_id: z.string().min(1, "年度を選択してください"),
  is_completed: z.boolean().default(false),
  completion_date: z.string().optional(),
  notes: z.string().max(500, "備考は500文字以内で入力してください").optional(),
});

// Function to get fiscal year from date
export const getFiscalYear = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  
  if (month >= 7) {
    return `${year}年度`;
  } else {
    return `${year - 1}年度`;
  }
};

// Group form validation
export const groupFormSchema = z.object({
  competition_id: z.string().min(1, "コンペIDが必要です"),
  group_number: z.number().min(1, "組番号は1以上で入力してください"),
  start_time: z.string().optional(),
  notes: z.string().max(200, "備考は200文字以内で入力してください").optional(),
  member_ids: z.array(z.string()).min(1, "最低1名のメンバーを選択してください").max(4, "1組は最大4名です"),
});

// Function to calculate celebration ages for a member
export const getCelebrationInfo = (birthDate: string, currentYear: number = new Date().getFullYear()) => {
  const birth = new Date(birthDate);
  const birthYear = birth.getFullYear();
  const currentAge = currentYear - birthYear;
  
  const celebrationAges = [60, 70, 77, 80] as const;
  const upcomingCelebrations = [];
  
  for (const age of celebrationAges) {
    const yearTurning = birthYear + age;
    const isThisYear = yearTurning === currentYear;
    const isPastDue = yearTurning < currentYear;
    const isUpcoming = yearTurning > currentYear;
    
    if (isThisYear || isPastDue || (isUpcoming && yearTurning <= currentYear + 5)) {
      upcomingCelebrations.push({
        age,
        year_turning: yearTurning,
        is_this_year: isThisYear,
        is_past_due: isPastDue,
        is_upcoming: isUpcoming,
      });
    }
  }
  
  return {
    current_age: currentAge,
    upcoming_celebrations: upcomingCelebrations,
  };
};