"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Video } from "lucide-react";

export default function GroupCallButton({
  currentUserId,
  conversationId,
  participantIds,
  groupName,
}: {
  currentUserId: string;
  conversationId: string;
  participantIds: string[];
  groupName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const startGroupCall = async () => {
    setLoading(true);

    // Create group call
    const { data: call, error } = await supabase
      .from("video_calls")
      .insert({
        caller_id: currentUserId,
        receiver_id: null,
        call_type: "video",
        is_group: true,
        conversation_id: conversationId,
        group_name: groupName || "Group Call",
        status: "ringing",
      })
      .select()
      .single();

    if (error || !call) {
      console.error(error);
      setLoading(false);
      return;
    }

    // Add all participants
    const participants = participantIds.map((uid) => ({
      call_id: call.id,
      user_id: uid,
    }));

    await supabase.from("call_participants").insert(participants);

    // Notify others
    const others = participantIds.filter((id) => id !== currentUserId);
    if (others.length > 0) {
      await supabase.from("notifications").insert(
        others.map((uid) => ({
          user_id: uid,
          actor_id: currentUserId,
          type: "message",
          entity_id: call.id,
          message: `បានអញ្ជើញអ្នកចូល Group Video Call`,
        }))
      );
    }

    router.push(`/call/group/${call.id}`);
    setLoading(false);
  };

  return (
    <button
      onClick={startGroupCall}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition"
      title="Group Video Call"
    >
      <Video size={16} />
      {loading ? "..." : "Group Call"}
    </button>
  );
}
