import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./InviteForm";
import type { Profile } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PeoplePage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("role")
    .order("full_name");

  const list = (profiles ?? []) as Profile[];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section>
        <h1 className="mb-4 text-xl font-semibold">People</h1>
        <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs text-neutral-500 dark:bg-neutral-900">
              <tr>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Role</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-neutral-100 dark:border-neutral-800">
                  <td className="px-4 py-2">{p.full_name}</td>
                  <td className="px-4 py-2 capitalize">{p.role}</td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-neutral-400">
                    No one invited yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Invite someone</h2>
        <InviteForm />
      </section>
    </div>
  );
}
