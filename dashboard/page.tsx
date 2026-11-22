"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { money } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Briefcase, Users, Receipt, TrendingUp, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    jobs: 0,
    customers: 0,
    revenue: 0,
    outstanding: 0,
  });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [jobs, customers, invoices] = await Promise.all([
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("invoices").select("*"),
      ]);
      const j = jobs.data || [];
      const inv = invoices.data || [];
      const revenue = inv
        .filter((x) => x.status === "paid")
        .reduce((s, x) => s + Number(x.total), 0);
      const outstanding = inv
        .filter((x) => x.status !== "paid")
        .reduce((s, x) => s + Number(x.total), 0);
      setStats({
        jobs: j.length,
        customers: customers.count || 0,
        revenue,
        outstanding,
      });
      setRecentJobs(j.slice(0, 5));
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Active Jobs", value: stats.jobs, icon: Briefcase, color: "text-blue-600 bg-blue-50" },
    { label: "Customers", value: stats.customers, icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "Revenue (paid)", value: money(stats.revenue), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50" },
    { label: "Outstanding", value: money(stats.outstanding), icon: Receipt, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Here's what's happening with your business.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="card p-4 md:p-5">
            <div className={`w-9 h-9 rounded-lg grid place-items-center ${c.color}`}>
              <c.icon className="h-4 w-4" />
            </div>
            <p className="text-xs text-slate-500 mt-3">{c.label}</p>
            <p className="text-lg md:text-2xl font-bold mt-1 truncate">
              {loading ? (
                <span className="inline-block h-6 w-16 bg-slate-100 animate-pulse rounded" />
              ) : (
                c.value
              )}
            </p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-semibold">Recent jobs</h2>
          <Link
            href="/jobs"
            className="text-sm text-brand-600 font-medium flex items-center gap-1"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-slate-500">No jobs yet.</p>
            <Link href="/jobs" className="btn-primary mt-3 inline-flex">
              Create your first job
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recentJobs.map((j) => (
              <li key={j.id} className="p-4 hover:bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{j.title}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {j.scheduled_date || "Unscheduled"} ·{" "}
                      {money(Number(j.estimated_hours) * Number(j.labor_rate))}
                    </p>
                  </div>
                  <StatusBadge status={j.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
