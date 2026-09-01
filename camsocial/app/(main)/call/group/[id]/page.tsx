import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import GroupCallRoom from "@/components/call/GroupCallRoom";

export default async function GroupCallPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: call } = await supabase
    .from("video_calls")
    .select("*")
    .eq("id", id)
    .single();

  if (!call || !call.is_group) notFound();

  if (["ended", "rejected", "missed"].includes(call.status)) {
    redirect("/messages");
  }

  // Get participants
  const { data: participants } = await supabase
    .from("call_participants")
    .select(`
      user_id,
      profiles (id, username, full_name, avatar_url)
    `)
    .eq("call_id", id);

  // Check if user is allowed
  const isParticipant = participants?.some((p) => p.user_id === user.id);
  if (!isParticipant && call.caller_id !== user.id) {
    // Auto-join if invited via conversation
    await supabase.from("call_participants").insert({
      call_id: id,
      user_id: user.id,
    });
  }

  return (
    <GroupCallRoom
      callId={id}
      currentUserId={user.id}
      groupName={call.group_name}
      initialParticipants={participants || []}
    />
  );
}
