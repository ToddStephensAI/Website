import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { PortalHeader } from "@/components/PortalHeader";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader title="Your project" homeHref="/customer" userName={profile.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
