"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { money, formatDate } from "@/lib/utils";
import { Briefcase, Plus, Pencil, Trash2, Camera, MapPin, Calendar as CalIcon, CheckCircle2, XCircle, DollarSign, Upload } from "lucide-react";
import type { Job, Customer, Employee } from "@/lib/types";

const empty = {
  title: "", description: "", status: "scheduled", scheduled_date: "", scheduled_time: "",
  address: "", estimated_hours: 0, actual_hours: 0, labor_rate: 0, material_cost: 0,
  customer_id: "", assigned_employee_id: "", approval_status: "pending", approval_notes: "",
};

export default function JobsPage() {
  const supabase = createClient();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Job | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<Job | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [filter, setFilter] = useState("all");

  async function load() {
    const [j, c, e] = await Promise.all([
      supabase.from("jobs").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("name"),
      supabase.from("employees").select("*").order("name"),
    ]);
    setItems(j.data || []);
    setCustomers(c.data || []);
    setEmployees(e.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() { setEditing(null); setForm({ ...empty, customer_id: customers[0]?.id || "" }); setModal(true); }
  function openEdit(j: Job) {
    setEditing(j);
    setForm({ ...empty, ...j, customer_id: j.customer_id, assigned_employee_id: j.assigned_employee_id || "" });
    setModal(true);
  }

  async function save() {
    if (!form.customer_id) { push("Select a customer", "error"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }
    const payload = {
      ...form,
      estimated_hours: Number(form.estimated_hours) || 0,
      actual_hours: Number(form.actual_hours) || 0,
      labor_rate: Number(form.labor_rate) || 0,
      material_cost: Number(form.material_cost) || 0,
      assigned_employee_id: form.assigned_employee_id || null,
      scheduled_date: form.scheduled_date || null,
    };
    if (editing) {
      const { error } = await supabase.from("jobs").update(payload).eq("id", editing.id);
      if (error) push(error.message, "error");
      else { setItems((p) => p.map((x) => (x.id === editing.id ? { ...x, ...payload } : x))); push("Job updated"); setModal(false); }
    } else {
      const { data, error } = await supabase.from("jobs").insert({ ...payload, user_id: user.id }).select().single();
      if (error) push(error.message, "error");
      else { setItems((p) => [data, ...p]); push("Job created"); setModal(false); }
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("jobs").delete().eq("id", delTarget.id);
    if (error) push(error.message, "error");
    else { setItems((p) => p.filter((x) => x.id !== delTarget.id)); push("Job deleted"); }
    setDeleting(false);
    setDelTarget(null);
  }

  async function updateStatus(j: Job, status: string) {
    setItems((p) => p.map((x) => (x.id === j.id ? { ...x, status } : x)));
    const { error } = await supabase.from("jobs").update({ status }).eq("id", j.id);
    if (error) { push(error.message, "error"); load(); } else push(`Marked ${status}`);
  }

  async function setApproval(j: Job, status: "approved" | "rejected") {
    setItems((p) => p.map((x) => (x.id === j.id ? { ...x, approval_status: status } : x)));
    const { error } = await supabase.from("jobs").update({ approval_status: status }).eq("id", j.id);
    if (error) { push(error.message, "error"); load(); } else push(`Approval: ${status}`);
  }

  async function uploadPhoto(j: Job, which: "before" | "after", file: File) {
    const path = `${j.id}/${which}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (upErr) { push(upErr.message, "error"); return; }
    const { data
