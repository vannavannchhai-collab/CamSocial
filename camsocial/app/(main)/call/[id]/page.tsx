import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import VideoCallRoom from "@/components/call/VideoCallRoom";

export default async function CallPage({
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
    .select(`
      *,
      caller:profiles!video_calls_caller_id_fkey (id, username, full_name, avatar_url),
      receiver:profiles!video_calls_receiver_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq("id", id)
    .single();

  if (!call) notFound();

  if (call.caller_id !== user.id && call.receiver_id !== user.id) {
    notFound();
  }

  if (["ended", "rejected", "missed"].includes(call.status)) {
    redirect("/messages");
  }

  // Redirect group calls to group call page
  if (call.is_group) {
    redirect(`/call/group/${call.id}`);
  }

  const isCaller = call.caller_id === user.id;
  const otherUser = isCaller ? call.receiver : call.caller;

  return (
    <VideoCallRoom
      callId={id}
      currentUserId={user.id}
      isCaller={isCaller}
      otherUser={otherUser}
      callType={call.call_type || "video"}
    />
  );
}
