import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StageBadge } from "@/components/StageBadge";
import type { Project } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ContractorHome() {
  const me = await getCurrentProfile();
  const supabase = await createClient();

  const { data: links } = await supabase
    .from("project_contractors")
    .select("project_id")
    .eq("contractor_id", me!.id);

  const projectIds = (links ?? []).map((l) => l.project_id);

  const { data: projects } =
    projectIds.length > 0
      ? await supabase
          .from("projects")
          .select("*")
          .in("id", projectIds)
          .order("updated_at", { ascending: false })
      : { data: [] };

  const projectList = (projects ?? []) as Project[];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your jobs</h1>
      <div className="flex flex-col gap-3">
        {projectList.map((p) => (
          <Link
            key={p.id}
            href={`/contractor/projects/${p.id}`}
            className="flex items-center justify-between rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div>
              <p className="font-medium">{p.reference}</p>
              <p className="text-sm text-neutral-500">{p.site_address}</p>
            </div>
            <StageBadge stage={p.stage} />
          </Link>
        ))}
        {projectList.length === 0 && (
          <p className="text-sm text-neutral-400">No jobs assigned to you yet.</p>
        )}
      </div>
    </div>
  );
}
