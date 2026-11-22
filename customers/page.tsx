"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Users, Plus, Pencil, Trash2, Mail, Phone, MapPin, Search } from "lucide-react";
import type { Customer } from "@/lib/types";

const empty = { name: "", email: "", phone: "", address: "", notes: "" };

export default function CustomersPage() {
  const supabase = createClient();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Customer[]>([]);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setModal(true);
  }
  function openEdit(c: Customer) {
    setEditing(c);
    setForm({
      name: c.name,
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      notes: c.notes || "",
    });
    setModal(true);
  }

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    if (editing) {
      const { error } = await supabase
        .from("customers")
        .update(form)
        .eq("id", editing.id);
      if (error) push(error.message, "error");
      else {
        setItems((prev) =>
          prev.map((x) => (x.id === editing.id ? { ...x, ...form } : x))
        );
        push("Customer updated");
        setModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("customers")
        .insert({ ...form, user_id: user.id })
        .select()
        .single();
      if (error) push(error.message, "error");
      else {
        setItems((prev) => [data, ...prev]);
        push("Customer added");
        setModal(false);
      }
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("id", delTarget.id);
    if (error) push(error.message, "error");
    else {
      setItems((prev) => prev.filter((x) => x.id !== delTarget.id));
      push("Customer deleted");
    }
    setDeleting(false);
    setDelTarget(null);
  }

  const filtered = items.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.email?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">{items.length} total</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add customer
        </button>
      </div>

      <div className="relative">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          className="input pl-9"
          placeholder="Search customers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card h-32 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="h-6 w-6" />}
            title="No customers yet"
            description="Add your first customer to start scheduling jobs."
            action={
              <button className="btn-primary" onClick={openNew}>
                <Plus className="h-4 w-4" /> Add customer
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <div key={c.id} className="card p-4 hover:shadow-md transition group">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-full bg-brand-50 text-brand-700 grid place-items-center font-bold text-sm shrink-0">
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex gap-1 opacity-60 sm:opacity-0 group-hover:opacity-100 transition">
                  <button
                    className="p-1.5 rounded hover:bg-slate-100"
                    onClick={() => openEdit(c)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    onClick={() => setDelTarget(c)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="font-semibold mt-3 truncate">{c.name}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                {c.email && (
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3 w-3 shrink-0" />
                    {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-1.5">
                    <Phone className="h-3 w-3 shrink-0" />
                    {c.phone}
                  </p>
                )}
                {c.address && (
                  <p className="flex items-center gap-1.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {c.address}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit customer" : "Add customer"}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={save}
              disabled={saving || !form.name}
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Add customer"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Name *</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Address</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete customer?"
        message={`This will delete "${delTarget?.name}" and all related jobs, quotes and invoices.`}
      />
    </div>
  );
}
