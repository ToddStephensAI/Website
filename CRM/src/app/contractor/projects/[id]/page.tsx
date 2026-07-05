import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StageBadge } from "@/components/StageBadge";
import { StageControl } from "@/components/StageControl";
import { ChatThread } from "@/components/ChatThread";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SignaturePad } from "@/components/SignaturePad";
import { NotifyArrivalButton } from "@/components/NotifyArrivalButton";
import { ScheduleReturnVisit } from "@/components/ScheduleReturnVisit";
import type { Photo, Message, Signoff } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function ContractorProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentProfile();
  if (!me) notFound();

  const supabase = await createClient();

  const { data: link } = await supabase
    .from("project_contractors")
    .select("project_id")
    .eq("project_id", id)
    .eq("contractor_id", me.id)
    .maybeSingle();
  if (!link) notFound();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [{ data: customer }, { data: photos }, { data: messages }, { data: signoff }] =
    await Promise.all([
      project.customer_id
        ? supabase.from("profiles").select("*").eq("id", project.customer_id).single()
        : Promise.resolve({ data: null }),
      supabase.from("photos").select("*").eq("project_id", id).order("created_at"),
      supabase.from("messages").select("*").eq("project_id", id).order("created_at"),
      supabase.from("signoffs").select("*").eq("project_id", id).maybeSingle(),
    ]);

  const participants: Record<string, { name: string; role: string }> = { [me.id]: { name: me.full_name, role: "contractor" } };
  if (customer) participants[customer.id] = { name: customer.full_name, role: "customer" };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{project.reference}</h1>
          <p className="text-sm text-neutral-500">{project.site_address}</p>
        </div>
        <StageBadge stage={project.stage} />
      </div>

      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <NotifyArrivalButton projectId={project.id} contractorId={me.id} />
          <ScheduleReturnVisit
            projectId={project.id}
            reference={project.reference}
            contractorId={me.id}
          />
        </div>
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
  );
}
