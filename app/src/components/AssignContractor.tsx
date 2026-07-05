"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function AssignContractor({
  projectId,
  allContractors,
  assigned,
}: {
  projectId: string;
  allContractors: Profile[];
  assigned: Profile[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [contractorId, setContractorId] = useState("");
  const [saving, setSaving] = useState(false);

  const available = allContractors.filter((c) => !assigned.some((a) => a.id === c.id));

  async function handleAssign() {
    if (!contractorId) return;
    setSaving(true);
    await supabase
      .from("project_contractors")
      .insert({ project_id: projectId, contractor_id: contractorId });
    setSaving(false);
    setContractorId("");
    router.refresh();
  }

  async function handleRemove(contractorIdToRemove: string) {
    await supabase
      .from("project_contractors")
      .delete()
      .eq("project_id", projectId)
      .eq("contractor_id", contractorIdToRemove);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 font-medium">Contractors on this job</h3>
      <ul className="mb-3 flex flex-col gap-1.5">
        {assigned.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-sm">
            <span>{c.full_name}</span>
            <button
              onClick={() => handleRemove(c.id)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
        {assigned.length === 0 && <p className="text-sm text-neutral-400">Unassigned.</p>}
      </ul>
      <div className="flex gap-2">
        <select
          value={contractorId}
          onChange={(e) => setContractorId(e.target.value)}
          className="flex-1 rounded-md border border-neutral-300 px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Add a contractor…</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssign}
          disabled={saving || !contractorId}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          Add
        </button>
      </div>
    </div>
  );
}
