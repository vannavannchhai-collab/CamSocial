"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Video, Phone, PhoneOff } from "lucide-react";

export default function IncomingCallListener({ userId }: { userId: string }) {
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("incoming-calls")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_calls",
          filter: `receiver_id=eq.${userId}`,
        },
        async (payload) => {
          const call = payload.new;
          if (call.status !== "ringing") return;

          const { data: caller } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .eq("id", call.caller_id)
            .single();

          setIncomingCall({ ...call, caller });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const acceptCall = async () => {
    if (!incomingCall) return;
    await supabase
      .from("video_calls")
      .update({ status: "accepted", started_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    setIncomingCall(null);

    if (incomingCall.is_group) {
      router.push(`/call/group/${incomingCall.id}`);
    } else {
      router.push(`/call/${incomingCall.id}`);
    }
  };

  const rejectCall = async () => {
    if (!incomingCall) return;
    await supabase
      .from("video_calls")
      .update({ status: "rejected", ended_at: new Date().toISOString() })
      .eq("id", incomingCall.id);
    setIncomingCall(null);
  };

  if (!incomingCall) return null;

  const isVoice = incomingCall.call_type === "voice";

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center">
      <div className="bg-slate-900 text-white rounded-3xl p-8 text-center max-w-sm mx-4 shadow-2xl">
        <div className="w-24 h-24 rounded-full bg-blue-600 mx-auto flex items-center justify-center text-3xl font-bold mb-4 animate-pulse">
          {incomingCall.caller?.full_name?.[0] || "?"}
        </div>
        <p className="text-xl font-semibold">
          {incomingCall.caller?.full_name || "មានគេហៅ"}
        </p>
        <p className="text-slate-400 mt-1 flex items-center justify-center gap-2">
          {isVoice ? <Phone size={16} /> : <Video size={16} />}
          {isVoice ? "កំពុងហៅសម្លេង..." : "កំពុងហៅវីដេអូ..."}
        </p>

        <div className="flex justify-center gap-8 mt-8">
          <button
            onClick={rejectCall}
            className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-700 transition"
          >
            <PhoneOff size={28} />
          </button>
          <button
            onClick={acceptCall}
            className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-700 transition"
          >
            {isVoice ? <Phone size={28} /> : <Video size={28} />}
          </button>
        </div>
      </div>
    </div>
  );
}
