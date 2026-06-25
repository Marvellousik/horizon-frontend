"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Endorser {
  id: string;
  name: string;
  vouched_date: string;
  mutualConnections?: number;
}

export default function EndorsementsPage() {
  const router = useRouter();
  const [endorsers] = useState<Endorser[]>([
    { id: "1", name: "Aisha Bello", vouched_date: "2 weeks ago", mutualConnections: 3 },
    { id: "2", name: "Chinedu Okoro", vouched_date: "1 month ago", mutualConnections: 5 },
    { id: "3", name: "Fatima Yusuf", vouched_date: "3 days ago", mutualConnections: 1 },
    { id: "4", name: "Emeka Nwosu", vouched_date: "6 months ago", mutualConnections: 2 },
  ]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const toggle = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }));

  const sendRequests = async () => {
    const chosen = Object.keys(selected).filter((k) => selected[k]);
    if (chosen.length === 0) {
      setMessage("Please select at least one neighbor to request endorsement from.");
      return;
    }

    setSending(true);
    try {
      // TODO: Replace with real API call to send endorsement requests
      await new Promise((r) => setTimeout(r, 800));
      setMessage(`Requested endorsements from ${chosen.length} neighbor(s).`);
      setSelected({});
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage("Failed to send requests. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background dark:bg-background-dim p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary dark:text-white font-serif">Request Endorsements</h1>
          <button
            onClick={() => router.back()}
            className="text-sm text-text-secondary dark:text-slate-300 hover:underline"
          >
            Back
          </button>
        </div>

        <p className="text-sm text-text-secondary dark:text-slate-300 mb-4">Choose neighbors to request an endorsement from.</p>

        <div className="bg-surface dark:bg-surface rounded-xl p-4 shadow-sm space-y-3">
          {endorsers.map((e) => (
            <label key={e.id} className="flex items-center justify-between gap-3 p-3 rounded hover:bg-background-dim dark:hover:bg-stone-700 transition">
              <div>
                <p className="font-semibold text-text-primary dark:text-white">{e.name}</p>
                <p className="text-xs text-text-secondary dark:text-slate-400">Vouched {e.vouched_date} • {e.mutualConnections} mutual</p>
              </div>
              <input type="checkbox" checked={!!selected[e.id]} onChange={() => toggle(e.id)} />
            </label>
          ))}
        </div>

        {message && (
          <div className="mt-4 text-sm p-3 rounded bg-emerald-50 dark:bg-emerald-900/20 text-text-primary">{message}</div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={sendRequests}
            disabled={sending}
            className="flex-1 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-hover disabled:opacity-60"
          >
            {sending ? "Sending..." : "Request Selected"}
          </button>
          <button onClick={() => setSelected({})} className="py-3 px-4 border rounded-lg">Clear</button>
        </div>
      </div>
    </div>
  );
}
