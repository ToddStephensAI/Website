"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ScheduleReturnVisit({
  projectId,
  reference,
  contractorId,
}: {
  projectId: string;
  reference: string;
  contractorId: string;
}) {
  const supabase = createClient();
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSchedule() {
    if (!date) return;
    setSaving(true);

    const formatted = new Date(date).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    await supabase.from("tasks").insert({
      project_id: projectId,
      title: `Return visit scheduled for ${formatted} — job ${reference}`,
    });

    await supabase.from("messages").insert({
      project_id: projectId,
      sender_id: contractorId,
      body: `Sorry for the delay — we've scheduled a return visit for ${formatted}. We'll be in touch beforehand.`,
    });

    setSaving(false);
    setDone(true);
  }

  if (done) {
    return <p className="text-sm text-green-600">Return visit scheduled and customer notified.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <button
        onClick={handleSchedule}
        disabled={saving || !date}
        className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
      >
        {saving ? "Scheduling…" : "Schedule return visit"}
      </button>
    </div>
  );
}
