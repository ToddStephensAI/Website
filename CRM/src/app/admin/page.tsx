import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StageBadge } from "@/components/StageBadge";
import { TaskList } from "@/components/TaskList";
import { STAGE_ORDER, STAGE_LABELS, type Project, type Task } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ data: projects }, { data: tasks }] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("tasks").select("*").order("created_at", { ascending: false }),
  ]);

  const projectList = (projects ?? []) as Project[];
  const taskList = (tasks ?? []) as Task[];
  const openTaskCount = taskList.filter((t) => t.status === "open").length;

  const counts = STAGE_ORDER.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = projectList.filter((p) => p.stage === stage).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <section>
        <h1 className="mb-4 text-xl font-semibold">Insights</h1>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {STAGE_ORDER.map((stage) => (
            <div
              key={stage}
              className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800"
            >
              <p className="text-2xl font-semibold">{counts[stage] ?? 0}</p>
              <p className="text-xs text-neutral-500">{STAGE_LABELS[stage]}</p>
            </div>
          ))}
          <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
            <p className="text-2xl font-semibold">{openTaskCount}</p>
            <p className="text-xs text-neutral-500">Open tasks</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Active jobs</h2>
          <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs text-neutral-500 dark:bg-neutral-900">
                <tr>
                  <th className="px-4 py-2">Reference</th>
                  <th className="px-4 py-2">Site address</th>
                  <th className="px-4 py-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {projectList.map((p) => (
                  <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                    <td className="px-4 py-2">
                      <Link href={`/admin/projects/${p.id}`} className="font-medium hover:underline">
                        {p.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-2">{p.site_address}</td>
                    <td className="px-4 py-2">
                      <StageBadge stage={p.stage} />
                    </td>
                  </tr>
                ))}
                {projectList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                      No jobs yet.{" "}
                      <Link href="/admin/projects/new" className="underline">
                        Create the first one
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">To-do</h2>
          <TaskList initialTasks={taskList} />
        </section>
      </div>
    </div>
  );
}
