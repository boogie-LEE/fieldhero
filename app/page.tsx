import Link from "next/link";
import { Sparkles, Calendar, FileText, Receipt, Users, Camera, TrendingUp } from "lucide-react";

export default function Home() {
  const features = [
    { icon: Users, title: "Customers", desc: "Centralize every client contact and history." },
    { icon: Calendar, title: "Scheduling", desc: "Assign jobs to employees and track progress." },
    { icon: FileText, title: "Quotes", desc: "Professional quotations in seconds." },
    { icon: Camera, title: "Photos", desc: "Before & after evidence, per job." },
    { icon: Receipt, title: "Invoices", desc: "Automatic invoicing and payment tracking." },
    { icon: TrendingUp, title: "Profitability", desc: "See margin on every single job." },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-brand-50/30 to-white">
      <header className="max-w-6xl mx-auto px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight">FieldHero</span>
        </div>
        <nav className="flex gap-2">
          <Link href="/login" className="btn-ghost">Log in</Link>
          <Link href="/signup" className="btn-primary">Get started</Link>
        </nav>
      </header>
      <section className="max-w-4xl mx-auto text-center px-5 pt-16 pb-20">
        <span className="badge bg-brand-100 text-brand-700">Built for cleaning, mechanics, electricians & more</span>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mt-5 leading-[1.05]">
          The operating system for<br className="hidden sm:block" />
          <span className="text-brand-600"> your field service business</span>
        </h1>
        <p className="text-slate-600 mt-5 text-base sm:text-lg max-w-2xl mx-auto">
          Customers, jobs, quotes, invoices, photos, approvals and job profitability — all in one place.
        </p>
        <div className="mt-8 flex gap-3 justify-center flex-wrap">
          <Link href="/signup" className="btn-primary px-6 py-2.5">Start free →</Link>
          <Link href="/login" className="btn-secondary px-6 py-2.5">I have an account</Link>
        </div>
      </section>
      <section className="max-w-5xl mx-auto px-5 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f) => (
          <div key={f.title} className="card p-5">
            <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <f.icon className="h-4 w-4" />
            </div>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-slate-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
