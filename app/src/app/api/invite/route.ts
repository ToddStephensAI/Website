import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types/database";

export async function POST(request: Request) {
  const me = await getCurrentProfile();
  if (!me || me.role !== "admin") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { email, fullName, role } = (await request.json()) as {
    email: string;
    fullName: string;
    role: UserRole;
  };

  if (!email || !fullName || !["contractor", "customer"].includes(role)) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email);
  if (inviteError || !invited.user) {
    return NextResponse.json(
      { error: inviteError?.message ?? "Could not send invite" },
      { status: 500 }
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .insert({ id: invited.user.id, role, full_name: fullName });

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
