const statusMap: Record<string, string> = {
  scheduled: "bg-blue-50 text-blue-700",
  "in-progress": "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-emerald-50 text-emerald-700",
  declined: "bg-red-50 text-red-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  pending: "bg-amber-50 text-amber-700",
  unpaid: "bg-amber-50 text-amber-700",
  paid: "bg-emerald-50 text-emerald-700",
  overdue: "bg-red-50 text-red-700",
  partial: "bg-blue-50 text-blue-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${statusMap[status] || "bg-slate-100 text-slate-600"} capitalize`}>
      {status.replace("-", " ")}
    </span>
  );
}
