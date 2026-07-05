import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StageBadge } from "@/components/StageBadge";
import { StageControl } from "@/components/StageControl";
import { AssignContractor } from "@/components/AssignContractor";
import { ChatThread } from "@/components/ChatThread";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SignaturePad } from "@/components/SignaturePad";
import { TaskList } from "@/components/TaskList";
import type { Profile, Photo, Message, Task, Signoff } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const me = await getCurrentProfile();
  if (!me) notFound();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [
    { data: customer },
    { data: contractorLinks },
    { data: allContractors },
    { data: photos },
    { data: messages },
    { data: tasks },
    { data: signoff },
  ] = await Promise.all([
    project.customer_id
      ? supabase.from("profiles").select("*").eq("id", project.customer_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("project_contractors").select("contractor_id").eq("project_id", id),
    supabase.from("profiles").select("*").eq("role", "contractor").order("full_name"),
    supabase.from("photos").select("*").eq("project_id", id).order("created_at"),
    supabase.from("messages").select("*").eq("project_id", id).order("created_at"),
    supabase.from("tasks").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("signoffs").select("*").eq("project_id", id).maybeSingle(),
  ]);

  const allContractorList = (allContractors ?? []) as Profile[];
  const assignedIds = (contractorLinks ?? []).map((l) => l.contractor_id);
  const assigned = allContractorList.filter((c) => assignedIds.includes(c.id));

  const participants: Record<string, { name: string; role: string }> = {};
  if (customer) participants[customer.id] = { name: customer.full_name, role: "customer" };
  assigned.forEach((c) => (participants[c.id] = { name: c.full_name, role: "contractor" }));
  participants[me.id] = { name: me.full_name, role: me.role };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.reference}</h1>
          <p className="text-sm text-neutral-500">{project.site_address}</p>
        </div>
        <StageBadge stage={project.stage} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <h3 className="mb-3 font-medium">Job details</h3>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-neutral-500">Customer</dt>
                <dd>{customer?.full_name ?? "Not set"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Equipment</dt>
                <dd>{project.equipment_summary ?? "—"}</dd>
              </div>
            </dl>
            <div className="mt-4">
              <p className="mb-1 text-sm text-neutral-500">Stage</p>
              <StageControl
                projectId={project.id}
                reference={project.reference}
                currentStage={project.stage}
              />
            </div>
          </section>

          <ChatThread
            projectId={project.id}
            currentUserId={me.id}
            participants={participants}
            initialMessages={(messages ?? []) as Message[]}
          />

          <PhotoGallery
            projectId={project.id}
            uploaderId={me.id}
            canUpload={true}
            initialPhotos={(photos ?? []) as Photo[]}
          />

          <SignaturePad projectId={project.id} existingSignoff={(signoff as Signoff) ?? null} />
        </div>

        <div className="flex flex-col gap-6">
          <AssignContractor
            projectId={project.id}
            allContractors={allContractorList}
            assigned={assigned}
          />
          <TaskList initialTasks={(tasks ?? []) as Task[]} projectId={project.id} />
        </div>
      </div>
    </div>
  );
}
