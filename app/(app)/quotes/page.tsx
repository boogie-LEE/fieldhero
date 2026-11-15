"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LineItemsEditor } from "@/components/jobs/LineItemsEditor";
import { money, formatDate } from "@/lib/utils";
import { FileText, Plus, Pencil, Trash2 } from "lucide-react";
import type { Quote, Customer, LineItem } from "@/lib/types";

const empty = { customer_id: "", quote_number: "", line_items: [] as LineItem[], tax: 0, status: "draft", notes: "", valid_until: "" };

export default function QuotesPage() {
  const supabase = createClient();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<Quote | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [q, c] = await Promise.all([
      supabase.from("quotes").select("*").order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("name"),
    ]);
    setItems(q.data || []); setCustomers(c.data || []); setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, quote_number: `Q-${Date.now().toString().slice(-6)}`, customer_id: customers[0]?.id || "", line_items: [{ description: "", qty: 1, rate: 0 }] });
    setModal(true);
  }
  function openEdit(q: Quote) {
    setEditing(q);
    setForm({ ...empty, ...q, customer_id: q.customer_id, line_items: q.line_items || [] });
    setModal(true);
  }

  function subtotal() { return (form.line_items || []).reduce((s: number, x: LineItem) => s + Number(x.qty) * Number(x.rate), 0); }
  function total() { return subtotal() + Number(form.tax || 0); }

  async function save() {
    if (!form.customer_id) { push("Select a customer", "error"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = {
      ...form, subtotal: subtotal(), total: total(), tax: Number(form.tax) || 0,
      valid_until: form.valid_until || null,
    };
    if (editing) {
      const { error } = await supabase.from("quotes").update(payload).eq("id", editing.id);
      if (error) push(error.message, "error");
      else { setItems((p) => p.map((x) => (x.id === editing.id ? { ...x, ...payload } : x))); push("Quote updated"); setModal(false); }
    } else {
      const { data, error } = await supabase.from("quotes").insert({ ...payload, user_id: user.id }).select().single();
      if (error) push(error.message, "error");
      else { setItems((p) => [data, ...p]); push("Quote created"); setModal(false); }
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("quotes").delete().eq("id", delTarget.id);
    if (error) push(error.message, "error");
    else { setItems((p) => p.filter((x) => x.id !== delTarget.id)); push("Quote deleted"); }
    setDeleting(false); setDelTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quotes</h1>
          <p className="text-sm text-slate-500 mt-1">Professional quotations for your clients.</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={openNew} disabled={customers.length === 0}>
          <Plus className="h-4 w-4" /> New quote
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="card h-20 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText className="h-6 w-6" />} title="No quotes yet"
            description="Generate a quote to send to your customers."
            action={<button className="btn-primary" onClick={openNew} disabled={customers.length === 0}><Plus className="h-4 w-4" /> New quote</button>} />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {items.map((q) => {
              const c = customers.find((x) => x.id === q.customer_id);
              return (
                <li key={q.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">{q.quote_number}</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="font-medium mt-1 truncate">{c?.name || "—"}</p>
                    <p className="text-xs text-slate-500">Total: {money(q.total)} · Valid until {formatDate(q.valid_until)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded hover:bg-slate-100" onClick={() => openEdit(q)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-red-600" onClick={() => setDelTarget(q)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit quote" : "New quote"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.customer_id}>{saving ? "Saving..." : "Save quote"}</button></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Quote #</label><input className="input" value={form.quote_number} onChange={(e) => setForm({ ...form, quote_number: e.target.value })} /></div>
            <div><label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["draft", "sent", "accepted", "declined"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div><label className="label">Customer *</label>
            <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className="label">Line items</label>
            <LineItemsEditor items={form.line_items || []} onChange={(v) => setForm({ ...form, line_items: v })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Tax ($)</label><input className="input" type="number" step="0.01" value={form.tax} onChange={(e) => setForm({ ...form, tax: e.target.value })} /></div>
            <div><label className="label">Valid until</label><input className="input" type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm flex justify-between">
            <span className="text-slate-500">Total</span><span className="font-semibold">{money(total())}</span>
          </div>
          <div><label className="label">Notes</label><textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      <Confirm open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={confirmDelete} loading={deleting}
        title="Delete quote?" message="This quote will be permanently deleted." />
    </div>
  );
}
