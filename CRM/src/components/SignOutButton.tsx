"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/login");
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
    >
      Sign out
    </button>
  );
}
