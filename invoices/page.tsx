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
import { Receipt, Plus, Pencil, Trash2, Bell, CheckCircle2 } from "lucide-react";
import type { Invoice, Customer, LineItem } from "@/lib/types";

const empty = {
  customer_id: "",
  invoice_number: "",
  line_items: [] as LineItem[],
  tax: 0,
  amount_paid: 0,
  status: "unpaid",
  due_date: "",
};

export default function InvoicesPage() {
  const supabase = createClient();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<Invoice | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const [i, c] = await Promise.all([
      supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase.from("customers").select("*").order("name"),
    ]);
    setItems(i.data || []);
    setCustomers(c.data || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    const due = new Date();
    due.setDate(due.getDate() + 14);
    setForm({
      ...empty,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      customer_id: customers[0]?.id || "",
      line_items: [{ description: "", qty: 1, rate: 0 }],
      due_date: due.toISOString().slice(0, 10),
    });
    setModal(true);
  }
  function openEdit(i: Invoice) {
    setEditing(i);
    setForm({
      ...empty,
      ...i,
      customer_id: i.customer_id,
      line_items: i.line_items || [],
    });
    setModal(true);
  }

  function subtotal() {
    return (form.line_items || []).reduce(
      (s: number, x: LineItem) => s + Number(x.qty) * Number(x.rate),
      0
    );
  }
  function total() {
    return subtotal() + Number(form.tax || 0);
  }

  async function save() {
    if (!form.customer_id) {
      push("Select a customer", "error");
      return;
    }
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const payload = {
      ...form,
      subtotal: subtotal(),
      total: total(),
      tax: Number(form.tax) || 0,
      amount_paid: Number(form.amount_paid) || 0,
      due_date: form.due_date || null,
      paid_at: form.status === "paid" ? new Date().toISOString() : null,
    };
    if (editing) {
      const { error } = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", editing.id);
      if (error) push(error.message, "error");
      else {
        setItems((p) =>
          p.map((x) => (x.id === editing.id ? { ...x, ...payload } : x))
        );
        push("Invoice updated");
        setModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("invoices")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) push(error.message, "error");
      else {
        setItems((p) => [data, ...p]);
        push("Invoice created");
        setModal(false);
      }
    }
    setSaving(false);
  }

  async function markPaid(i: Invoice) {
    setItems((p) =>
      p.map((x) =>
        x.id === i.id
          ? {
              ...x,
              status: "paid",
              amount_paid: x.total,
              paid_at: new Date().toISOString(),
            }
          : x
      )
    );
    const { error } = await supabase
      .from("invoices")
      .update({
        status: "paid",
        amount_paid: i.total,
        paid_at: new Date().toISOString(),
      })
      .eq("id", i.id);
    if (error) {
      push(error.message, "error");
      load();
    } else push("Marked as paid");
  }

  function reminder(i: Invoice) {
    const c = customers.find((x) => x.id === i.customer_id);
    const subject = encodeURIComponent(`Payment reminder: ${i.invoice_number}`);
    const body = encodeURIComponent(
      `Hi ${c?.name || "there"},\n\nThis is a friendly reminder that invoice ${
        i.invoice_number
      } for ${money(i.total)} was due on ${formatDate(
        i.due_date
      )}.\n\nPlease let us know if you have any questions.\n\nThank you!`
    );
    if (c?.email)
      window.location.href = `mailto:${c.email}?subject=${subject}&body=${body}`;
    else push("Customer has no email on file", "error");
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", delTarget.id);
    if (error) push(error.message, "error");
    else {
      setItems((p) => p.filter((x) => x.id !== delTarget.id));
      push("Invoice deleted");
    }
    setDeleting(false);
    setDelTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Send bills, track payments, remind.
          </p>
        </div>
        <button
          className="btn-primary self-start sm:self-auto"
          onClick={openNew}
          disabled={customers.length === 0}
        >
          <Plus className="h-4 w-4" /> New invoice
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No invoices yet"
            description="Create an invoice to bill your customers."
            action={
              <button
                className="btn-primary"
                onClick={openNew}
                disabled={customers.length === 0}
              >
                <Plus className="h-4 w-4" /> New invoice
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {items.map((i) => {
              const c = customers.find((x) => x.id === i.customer_id);
              return (
                <li key={i.id} className="p-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {i.invoice_number}
                        </span>
                        <StatusBadge status={i.status} />
                      </div>
                      <p className="font-medium mt-1 truncate">
                        {c?.name || "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        Due {formatDate(i.due_date)} · {money(i.total)}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {i.status !== "paid" && (
                        <>
                          <button
                            className="btn-secondary text-xs"
                            onClick={() => reminder(i)}
                          >
                            <Bell className="h-3.5 w-3.5" /> Remind
                          </button>
                          <button
                            className="btn-secondary text-xs text-emerald-700"
                            onClick={() => markPaid(i)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Paid
                          </button>
                        </>
                      )}
                      <button
                        className="p-1.5 rounded hover:bg-slate-100"
                        onClick={() => openEdit(i)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded hover:bg-red-50 text-red-600"
                        onClick={() => setDelTarget(i)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit invoice" : "New invoice"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving || !form.customer_id}
            >
              {saving ? "Saving..." : "Save invoice"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Invoice #</label>
              <input
                className="input"
                value={form.invoice_number}
                onChange={(e) =>
                  setForm({ ...form, invoice_number: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                {["unpaid", "partial", "paid", "overdue"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Customer *</label>
            <select
              className="input"
              value={form.customer_id}
              onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Line items</label>
            <LineItemsEditor
              items={form.line_items || []}
              onChange={(v) => setForm({ ...form, line_items: v })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tax ($)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Amount paid ($)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.amount_paid}
                onChange={(e) =>
                  setForm({ ...form, amount_paid: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="label">Due date</label>
            <input
              className="input"
              type="date"
              value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm flex justify-between">
            <span className="text-slate-500">Total</span>
            <span className="font-semibold">{money(total())}</span>
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete invoice?"
        message="This invoice will be permanently deleted."
      />
    </div>
  );
}
