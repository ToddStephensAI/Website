import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { StageTimeline } from "@/components/StageTimeline";
import { ChatThread } from "@/components/ChatThread";
import { PhotoGallery } from "@/components/PhotoGallery";
import type { Photo, Message, Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function CustomerProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await getCurrentProfile();
  if (!me) notFound();

  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("customer_id", me.id)
    .single();
  if (!project) notFound();

  const [{ data: contractorLinks }, { data: photos }, { data: messages }] = await Promise.all([
    supabase.from("project_contractors").select("contractor_id").eq("project_id", id),
    supabase.from("photos").select("*").eq("project_id", id).order("created_at"),
    supabase.from("messages").select("*").eq("project_id", id).order("created_at"),
  ]);

  const contractorIds = (contractorLinks ?? []).map((l) => l.contractor_id);
  const { data: contractors } =
    contractorIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", contractorIds)
      : { data: [] };

  const participants: Record<string, { name: string; role: string }> = {
    [me.id]: { name: me.full_name, role: "customer" },
  };
  ((contractors ?? []) as Profile[]).forEach(
    (c) => (participants[c.id] = { name: c.full_name, role: "contractor" })
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold">{project.reference}</h1>
        <p className="text-sm text-neutral-500">{project.site_address}</p>
      </div>

      <section className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <StageTimeline current={project.stage} />
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
        canUpload={false}
        initialPhotos={(photos ?? []) as Photo[]}
      />
    </div>
  );
}
