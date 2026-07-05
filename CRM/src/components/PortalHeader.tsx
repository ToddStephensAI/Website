import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export function PortalHeader({
  title,
  homeHref,
  userName,
}: {
  title: string;
  homeHref: string;
  userName: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 dark:border-neutral-800">
      <Link href={homeHref} className="font-semibold">
        Energy Concerns <span className="text-neutral-400">· {title}</span>
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-500">{userName}</span>
        <SignOutButton />
      </div>
    </header>
  );
}
