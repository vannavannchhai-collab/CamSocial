"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Video, Phone } from "lucide-react";

export default function VideoCallButton({
  currentUserId,
  targetUserId,
  targetName,
  showVoice = true,
}: {
  currentUserId: string;
  targetUserId: string;
  targetName?: string;
  showVoice?: boolean;
}) {
  const [loading, setLoading] = useState<"video" | "voice" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const startCall = async (callType: "video" | "voice") => {
    if (currentUserId === targetUserId) return;
    setLoading(callType);

    const { data: call, error } = await supabase
      .from("video_calls")
      .insert({
        caller_id: currentUserId,
        receiver_id: targetUserId,
        call_type: callType,
        is_group: false,
        status: "ringing",
      })
      .select()
      .single();

    if (error || !call) {
      console.error(error);
      setLoading(null);
      return;
    }

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      actor_id: currentUserId,
      type: "message",
      entity_id: call.id,
      message: callType === "video" ? "កំពុងហៅវីដេអូ..." : "កំពុងហៅសម្លេង...",
    });

    router.push(`/call/${call.id}`);
    setLoading(null);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startCall("video")}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
        title={`ហៅវីដេអូ ${targetName || ""}`}
      >
        <Video size={16} />
        {loading === "video" ? "..." : "វីដេអូ"}
      </button>

      {showVoice && (
        <button
          onClick={() => startCall("voice")}
          disabled={!!loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          title={`ហៅសម្លេង ${targetName || ""}`}
        >
          <Phone size={16} />
          {loading === "voice" ? "..." : "សម្លេង"}
        </button>
      )}
    </div>
  );
}
