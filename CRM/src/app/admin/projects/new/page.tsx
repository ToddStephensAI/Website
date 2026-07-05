import { createClient } from "@/lib/supabase/server";
import { NewProjectForm } from "./NewProjectForm";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["customer", "contractor"])
    .order("full_name");

  const all = (profiles ?? []) as Profile[];
  const customers = all.filter((p) => p.role === "customer");
  const contractors = all.filter((p) => p.role === "contractor");

  return (
    <div className="max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">New job</h1>
      <NewProjectForm customers={customers} contractors={contractors} />
    </div>
  );
}
