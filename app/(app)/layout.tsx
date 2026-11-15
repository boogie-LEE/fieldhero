"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Calendar, FileText, Receipt, UserCog,
  LogOut, Menu, X, Sparkles, Briefcase,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ToastProvider } from "@/components/ui/Toast";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/jobs", label: "Jobs", icon: Briefcase },
  { href: "/quotes", label: "Quotes", icon: FileText },
  { href: "/invoices", label: "Invoices", icon: Receipt },
  { href: "/employees", label: "Employees", icon: UserCog },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email || ""));
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-slate-50">
        {/* Sidebar */}
        <aside className={`fixed z-40 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold">FieldHero</span>
            </Link>
            <button className="md:hidden p-1 rounded hover:bg-slate-100" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {nav.map((n) => {
              const active = path === n.href || path.startsWith(n.href + "/");
              return (
                <Link key={n.href} href={n.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}`}>
                  <n.icon className="h-[18px] w-[18px]" />{n.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-3 border-t border-slate-100">
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-slate-500">Signed in</p>
              <p className="text-sm font-medium truncate">{email}</p>
            </div>
            <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
              <LogOut className="h-[18px] w-[18px]" /> Sign out
            </button>
          </div>
        </aside>

        {open && <div className="fixed inset-0 z-30 bg-slate-900/30 md:hidden" onClick={() => setOpen(false)} />}

        {/* Main */}
        <div className="flex-1 md:ml-64 flex flex-col min-w-0">
          <header className="h-16 bg-white/80 backdrop-blur sticky top-0 z-20 border-b border-slate-200 flex items-center px-4 md:px-6 gap-3">
            <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex-1" />
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 grid place-items-center text-xs font-bold">
              {email?.[0]?.toUpperCase() || "U"}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
