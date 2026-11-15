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
    setItems(j.data || []); setCustomers(c.data || []); setEmployees(e.data || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ ...empty, customer_id: customers[0]?.id || "" });
    setModal(true);
  }
  function openEdit(j: Job) {
    setEditing(j);
    setForm({ ...empty, ...j, customer_id: j.customer_id, assigned_employee_id: j.assigned_employee_id || "" });
    setModal(true);
  }

  async function save() {
    if (!form.customer_id) { push("Select a customer", "error"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
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
    setDeleting(false); setDelTarget(null);
  }

  async function updateStatus(j: Job, status: string) {
    setItems((p) => p.map((x) => (x.id === j.id ? { ...x, status } : x)));  // optimistic
    const { error } = await supabase.from("jobs").update({ status }).eq("id", j.id);
    if (error) { push(error.message, "error"); load(); }
    else push(`Marked ${status}`);
  }

  async function setApproval(j: Job, status: "approved" | "rejected") {
    setItems((p) => p.map((x) => (x.id === j.id ? { ...x, approval_status: status } : x)));
    const { error } = await supabase.from("jobs").update({ approval_status: status }).eq("id", j.id);
    if (error) { push(error.message, "error"); load(); }
    else push(`Approval: ${status}`);
  }

  async function uploadPhoto(j: Job, which: "before" | "after", file: File) {
    const path = `${j.id}/${which}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("job-photos").upload(path, file);
    if (upErr) { push(upErr.message, "error"); return; }
    const { data } = supabase.storage.from("job-photos").getPublicUrl(path);
    const field = which === "before" ? "before_photo_url" : "after_photo_url";
    const { error } = await supabase.from("jobs").update({ [field]: data.publicUrl }).eq("id", j.id);
    if (error) { push(error.message, "error"); return; }
    setItems((p) => p.map((x) => (x.id === j.id ? { ...x, [field]: data.publicUrl } : x)));
    push(`${which === "before" ? "Before" : "After"} photo uploaded`);
  }

  const filtered = items.filter((j) => filter === "all" || j.status === filter);

  const profit = (j: Job) => {
    const revenue = Number(j.estimated_hours) * Number(j.labor_rate);
    const cost = Number(j.actual_hours) * Number(j.labor_rate) * 0.4 + Number(j.material_cost);
    return revenue - cost;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs</h1>
          <p className="text-sm text-slate-500 mt-1">Track, schedule and approve work.</p>
        </div>
        <button className="btn-primary self-start sm:self-auto" onClick={openNew} disabled={customers.length === 0}>
          <Plus className="h-4 w-4" /> New job
        </button>
      </div>

      {customers.length === 0 && !loading && (
        <div className="card p-4 bg-amber-50 border-amber-200 text-sm text-amber-800">
          Add a customer first before creating jobs.
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {["all", "scheduled", "in-progress", "completed", "cancelled"].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              filter === s ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {s === "all" ? "All" : s.replace("-", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Briefcase className="h-6 w-6" />} title="No jobs here"
            description="Create a job to start tracking work and get approval from customers."
            action={<button className="btn-primary" onClick={openNew} disabled={customers.length === 0}><Plus className="h-4 w-4" /> New job</button>} />
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((j) => {
            const cust = customers.find((c) => c.id === j.customer_id);
            const emp = employees.find((e) => e.id === j.assigned_employee_id);
            return (
              <div key={j.id} className="card p-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{j.title}</h3>
                      <StatusBadge status={j.status} />
                      {j.approval_status !== "pending" && <StatusBadge status={j.approval_status} />}
                    </div>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{j.description || "No description"}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-2">
                      <span>👤 {cust?.name || "—"}</span>
                      <span className="flex items-center gap-1"><CalIcon className="h-3 w-3" /> {formatDate(j.scheduled_date)}</span>
                      {emp && <span>🧑‍🔧 {emp.name}</span>}
                      {j.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{j.address}</span>}
                      <span className="flex items-center gap-1 text-emerald-700"><DollarSign className="h-3 w-3" />Profit: {money(profit(j))}</span>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="p-1.5 rounded hover:bg-slate-100" onClick={() => openEdit(j)}><Pencil className="h-3.5 w-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-red-50 text-red-600" onClick={() => setDelTarget(j)}><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <PhotoBox label="Before" url={j.before_photo_url} onUpload={(f) => uploadPhoto(j, "before", f)} />
                  <PhotoBox label="After" url={j.after_photo_url} onUpload={(f) => uploadPhoto(j, "after", f)} />
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {j.status !== "in-progress" && j.status !== "completed" &&
                    <button className="btn-secondary text-xs" onClick={() => updateStatus(j, "in-progress")}>▶ Start</button>}
                  {j.status !== "completed" &&
                    <button className="btn-secondary text-xs" onClick={() => updateStatus(j, "completed")}><CheckCircle2 className="h-3.5 w-3.5" /> Complete</button>}
                  {j.approval_status !== "approved" &&
                    <button className="btn-secondary text-xs text-emerald-700" onClick={() => setApproval(j, "approved")}><CheckCircle2 className="h-3.5 w-3.5" /> Approve</button>}
                  {j.approval_status !== "rejected" &&
                    <button className="btn-secondary text-xs text-red-600" onClick={() => setApproval(j, "rejected")}><XCircle className="h-3.5 w-3.5" /> Reject</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit job" : "New job"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving || !form.title || !form.customer_id}>{saving ? "Saving..." : "Save"}</button></>}>
        <div className="space-y-3">
          <div><label className="label">Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Customer *</label>
            <select className="input" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Date</label><input className="input" type="date" value={form.scheduled_date || ""} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} /></div>
            <div><label className="label">Time</label><input className="input" type="time" value={form.scheduled_time || ""} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} /></div>
          </div>
          <div><label className="label">Assigned employee</label>
            <select className="input" value={form.assigned_employee_id} onChange={(e) => setForm({ ...form, assigned_employee_id: e.target.value })}>
              <option value="">Unassigned</option>
              {employees.filter((e) => e.active).map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div><label className="label">Address</label><input className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Est. hours</label><input className="input" type="number" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} /></div>
            <div><label className="label">Actual hours</label><input className="input" type="number" step="0.5" value={form.actual_hours} onChange={(e) => setForm({ ...form, actual_hours: e.target.value })} /></div>
            <div><label className="label">Labor rate ($/hr)</label><input className="input" type="number" step="0.01" value={form.labor_rate} onChange={(e) => setForm({ ...form, labor_rate: e.target.value })} /></div>
            <div><label className="label">Material cost ($)</label><input className="input" type="number" step="0.01" value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: e.target.value })} /></div>
          </div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {["scheduled", "in-progress", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select></div>
        </div>
      </Modal>

      <Confirm open={!!delTarget} onClose={() => setDelTarget(null)} onConfirm={confirmDelete} loading={deleting}
        title="Delete job?" message="This job will be permanently removed." />
    </div>
  );
}

function PhotoBox({ label, url, onUpload }: { label: string; url?: string | null; onUpload: (f: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
      <button onClick={() => ref.current?.click()} type="button"
        className="w-full aspect-video rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 overflow-hidden relative group">
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
            <Camera className="h-4 w-4" /> Upload
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <Upload className="h-4 w-4" />
        </div>
      </button>
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = ""; }} />
    </div>
  );
}
