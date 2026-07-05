import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { PortalHeader } from "@/components/PortalHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader title="Admin" homeHref="/admin" userName={profile.full_name} />
      <nav className="flex gap-4 border-b border-neutral-200 px-6 py-3 text-sm dark:border-neutral-800">
        <Link href="/admin" className="hover:underline">
          Dashboard
        </Link>
        <Link href="/admin/projects/new" className="hover:underline">
          New job
        </Link>
        <Link href="/admin/people" className="hover:underline">
          People
        </Link>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
