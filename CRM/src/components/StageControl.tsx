"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { STAGE_LABELS, STAGE_ORDER, type ProjectStage } from "@/types/database";

export function StageControl({
  projectId,
  reference,
  currentStage,
}: {
  projectId: string;
  reference: string;
  currentStage: ProjectStage;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [stage, setStage] = useState<ProjectStage>(currentStage);
  const [saving, setSaving] = useState(false);

  async function handleUpdate() {
    if (stage === currentStage) return;
    setSaving(true);

    await supabase.from("projects").update({ stage }).eq("id", projectId);

    if (stage === "complete") {
      await supabase.from("tasks").insert({
        project_id: projectId,
        title: `Job ${reference} marked complete — send handover email, book scaffolding/waste removal, raise invoice`,
      });
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={stage}
        onChange={(e) => setStage(e.target.value as ProjectStage)}
        className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      >
        {STAGE_ORDER.map((s) => (
          <option key={s} value={s}>
            {STAGE_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving || stage === currentStage}
        className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {saving ? "Updating…" : "Update stage"}
      </button>
    </div>
  );
}
