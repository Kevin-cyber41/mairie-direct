import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function assertAgent(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("agent") && !roles.includes("admin")) {
    throw new Error("Forbidden");
  }
}

export const inviteAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        fullName: z.string().min(1).max(100),
        password: z.string().min(8).max(72).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAgent(context.userId);

    const password =
      data.password ??
      `Ag${Math.random().toString(36).slice(2, 10)}!${Math.floor(Math.random() * 99)}`;

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error) throw new Error(error.message);

    const userId = created.user!.id;

    // Profile is auto-created by trigger; ensure name is set
    await supabaseAdmin
      .from("profiles")
      .upsert({ id: userId, full_name: data.fullName }, { onConflict: "id" });

    // Replace default citizen role with agent
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "agent" });
    if (roleErr) throw new Error(roleErr.message);

    return { userId, email: data.email, password };
  });

export const revokeAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAgent(context.userId);
    if (data.userId === context.userId) throw new Error("Vous ne pouvez pas vous révoquer.");

    const { error } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", "agent");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
