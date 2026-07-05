"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";

export function NewProjectForm({
  customers,
  contractors,
}: {
  customers: Profile[];
  contractors: Profile[];
}) {
  const supabase = createClient();
  const router = useRouter();

  const [siteAddress, setSiteAddress] = useState("");
  const [equipmentSummary, setEquipmentSummary] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [contractorId, setContractorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const reference = `EC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        reference,
        site_address: siteAddress,
        equipment_summary: equipmentSummary || null,
        customer_id: customerId || null,
      })
      .select()
      .single();

    if (insertError || !project) {
      setError(insertError?.message ?? "Could not create job.");
      setSaving(false);
      return;
    }

    if (contractorId) {
      await supabase
        .from("project_contractors")
        .insert({ project_id: project.id, contractor_id: contractorId });
    }

    router.push(`/admin/projects/${project.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Site address</label>
        <input
          required
          value={siteAddress}
          onChange={(e) => setSiteAddress(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Equipment</label>
        <input
          placeholder="e.g. 12x 440W panels, 5kW inverter, battery"
          value={equipmentSummary}
          onChange={(e) => setEquipmentSummary(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Customer</label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Select a customer…</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
        {customers.length === 0 && (
          <p className="mt-1 text-xs text-neutral-400">
            No customer accounts yet — add one under People first.
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Assign contractor</label>
        <select
          value={contractorId}
          onChange={(e) => setContractorId(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="">Unassigned</option>
          {contractors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {saving ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
