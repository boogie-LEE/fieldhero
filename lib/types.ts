export type Customer = {
  id: string; user_id: string; name: string; email?: string; phone?: string;
  address?: string; notes?: string; created_at: string;
};
export type Employee = {
  id: string; user_id: string; name: string; email?: string; phone?: string;
  role: string; hourly_rate: number; active: boolean; created_at: string;
};
export type Job = {
  id: string; user_id: string; customer_id: string; assigned_employee_id?: string | null;
  title: string; description?: string; status: string; scheduled_date?: string;
  scheduled_time?: string; address?: string; estimated_hours: number; actual_hours: number;
  labor_rate: number; material_cost: number; before_photo_url?: string | null;
  after_photo_url?: string | null; approval_status: string; approval_notes?: string | null;
  created_at: string;
};
export type Quote = {
  id: string; user_id: string; customer_id: string; job_id?: string | null;
  quote_number?: string; line_items: LineItem[]; subtotal: number; tax: number;
  total: number; status: string; notes?: string; valid_until?: string; created_at: string;
};
export type Invoice = {
  id: string; user_id: string; customer_id: string; job_id?: string | null;
  invoice_number?: string; line_items: LineItem[]; subtotal: number; tax: number;
  total: number; amount_paid: number; status: string; due_date?: string;
  paid_at?: string; created_at: string;
};
export type LineItem = { description: string; qty: number; rate: number };
export type Profile = {
  id: string; full_name?: string; company_name?: string; role?: string;
};
