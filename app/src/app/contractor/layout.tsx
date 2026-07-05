import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { PortalHeader } from "@/components/PortalHeader";

export default async function ContractorLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "contractor") redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader title="Contractor" homeHref="/contractor" userName={profile.full_name} />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
