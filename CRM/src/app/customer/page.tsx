import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StageBadge } from "@/components/StageBadge";
import type { Project } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomerHome() {
  const me = await getCurrentProfile();
  const supabase = await createClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .eq("customer_id", me!.id)
    .order("updated_at", { ascending: false });

  const projectList = (projects ?? []) as Project[];

  if (projectList.length === 1) {
    redirect(`/customer/projects/${projectList[0].id}`);
  }

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Your projects</h1>
      <div className="flex flex-col gap-3">
        {projectList.map((p) => (
          <Link
            key={p.id}
            href={`/customer/projects/${p.id}`}
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
          <p className="text-sm text-neutral-400">
            We don&apos;t have a project linked to your account yet — get in touch with our office.
          </p>
        )}
      </div>
    </div>
  );
}
