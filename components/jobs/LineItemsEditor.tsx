"use client";
import { Plus, Trash2 } from "lucide-react";
import { money } from "@/lib/utils";
import type { LineItem } from "@/lib/types";

export function LineItemsEditor({ items, onChange }: { items: LineItem[]; onChange: (v: LineItem[]) => void }) {
  function update(i: number, patch: Partial<LineItem>) {
    onChange(items.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }
  const subtotal = items.reduce((s, x) => s + Number(x.qty) * Number(x.rate), 0);
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input className="input flex-1" placeholder="Description" value={it.description} onChange={(e) => update(i, { description: e.target.value })} />
          <input className="input w-16" type="number" step="0.01" placeholder="Qty" value={it.qty} onChange={(e) => update(i, { qty: Number(e.target.value) })} />
          <input className="input w-24" type="number" step="0.01" placeholder="Rate" value={it.rate} onChange={(e) => update(i, { rate: Number(e.target.value) })} />
          <button className="p-2 rounded hover:bg-red-50 text-red-600 shrink-0" onClick={() => onChange(items.filter((_, x) => x !== i))}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button className="btn-ghost text-xs" onClick={() => onChange([...items, { description: "", qty: 1, rate: 0 }])}>
          <Plus className="h-3.5 w-3.5" /> Add line
        </button>
        <p className="text-sm font-medium">Subtotal: {money(subtotal)}</p>
      </div>
    </div>
  );
}
