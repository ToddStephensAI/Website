import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

const ROLE_HOME: Record<string, string> = {
  admin: "/admin",
  contractor: "/contractor",
  customer: "/customer",
};

export default async function Home() {
  const profile = await getCurrentProfile();
  if (profile) redirect(ROLE_HOME[profile.role] ?? "/login");

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-semibold">Energy Concerns — Job Management</h1>
      <p className="max-w-md text-neutral-500">
        Manage solar PV installation jobs end to end: contractors, customers, and the office, all
        on one page.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
      >
        Sign in
      </Link>
    </main>
  );
}
