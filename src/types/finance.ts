// Finance types for income and expense management

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  year_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  is_reimbursement: boolean;
  created_at: string;
}

export interface TransactionFormData {
  year_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  is_reimbursement: boolean;
}

export interface TransactionWithYear extends Transaction {
  year: {
    name: string;
  };
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  feeIncome: number;
  otherIncome: number;
  regularExpense: number;
  reimbursementExpense: number;
}

export interface MonthlyTransaction {
  month: string;
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}