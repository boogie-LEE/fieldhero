"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Confirm } from "@/components/ui/Confirm";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { money } from "@/lib/utils";
import { UserCog, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import type { Employee } from "@/lib/types";

const empty = {
  name: "",
  email: "",
  phone: "",
  role: "Technician",
  hourly_rate: 0,
  active: true,
};

export default function EmployeesPage() {
  const supabase = createClient();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Employee[]>([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [saving, setSaving] = useState(false);
  const [delTarget, setDelTarget] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  function openNew() {
    setEditing(null);
    setForm(empty);
    setModal(true);
  }
  function openEdit(e: Employee) {
    setEditing(e);
    setForm({
      name: e.name,
      email: e.email || "",
      phone: e.phone || "",
      role: e.role,
      hourly_rate: e.hourly_rate,
      active: e.active,
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
    const payload = { ...form, hourly_rate: Number(form.hourly_rate) || 0 };
    if (editing) {
      const { error } = await supabase
        .from("employees")
        .update(payload)
        .eq("id", editing.id);
      if (error) push(error.message, "error");
      else {
        setItems((p) =>
          p.map((x) => (x.id === editing.id ? { ...x, ...payload } : x))
        );
        push("Employee updated");
        setModal(false);
      }
    } else {
      const { data, error } = await supabase
        .from("employees")
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (error) push(error.message, "error");
      else {
        setItems((p) => [data, ...p]);
        push("Employee added");
        setModal(false);
      }
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!delTarget) return;
    setDeleting(true);
    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", delTarget.id);
    if (error) push(error.message, "error");
    else {
      setItems((p) => p.filter((x) => x.id !== delTarget.id));
      push("Employee deleted");
    }
    setDeleting(false);
    setDelTarget(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Assign jobs to your team.</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={openNew}>
          <Plus className="h-4 w-4" /> Add employee
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<UserCog className="h-6 w-6" />}
            title="No employees yet"
            description="Add your team to start assigning jobs."
            action={
              <button className="btn-primary" onClick={openNew}>
                <Plus className="h-4 w-4" /> Add employee
              </button>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {items.map((e) => (
              <li key={e.id} className="p-4 flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-full bg-brand-50 text-brand-700 grid place-items-center text-sm font-bold shrink-0">
                  {e.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {e.name}{" "}
                    {!e.active && (
                      <span className="badge bg-slate-100 text-slate-500 ml-1">
                        Inactive
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    {e.role} · {money(e.hourly_rate)}/hr
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500">
                  {e.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {e.email}
                    </span>
                  )}
                  {e.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {e.phone}
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    className="p-1.5 rounded hover:bg-slate-100"
                    onClick={() => openEdit(e)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                    onClick={() => setDelTarget(e)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={editing ? "Edit employee" : "Add employee"}
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
              {saving ? "Saving..." : "Save"}
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <input
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Hourly rate ($)</label>
              <input
                className="input"
                type="number"
                step="0.01"
                value={form.hourly_rate}
                onChange={(e) =>
                  setForm({ ...form, hourly_rate: e.target.value })
                }
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />{" "}
            Active
          </label>
        </div>
      </Modal>

      <Confirm
        open={!!delTarget}
        onClose={() => setDelTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete employee?"
        message={`Remove "${delTarget?.name}"? Jobs will be unassigned.`}
      />
    </div>
  );
}
