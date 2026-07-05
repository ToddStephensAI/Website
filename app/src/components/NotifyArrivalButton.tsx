"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotifyArrivalButton({
  projectId,
  contractorId,
}: {
  projectId: string;
  contractorId: string;
}) {
  const supabase = createClient();
  const [sending, setSending] = useState(false);

  function notify(mapsLink?: string) {
    const body = mapsLink
      ? `On our way to site now — you can track us here: ${mapsLink}`
      : "On our way to site now.";
    return supabase.from("messages").insert({ project_id: projectId, sender_id: contractorId, body });
  }

  async function handleClick() {
    setSending(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const link = `https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`;
          await notify(link);
          setSending(false);
        },
        async () => {
          await notify();
          setSending(false);
        },
        { timeout: 5000 }
      );
    } else {
      await notify();
      setSending(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={sending}
      className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-neutral-700"
    >
      {sending ? "Notifying…" : "Notify customer: on my way"}
    </button>
  );
}
