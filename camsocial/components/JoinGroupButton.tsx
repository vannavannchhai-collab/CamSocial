"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function JoinGroupButton({
  groupId,
  userId,
  isMember,
}: {
  groupId: string;
  userId: string;
  isMember: boolean;
}) {
  const [member, setMember] = useState(isMember);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async () => {
    setLoading(true);

    if (member) {
      await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", userId);
      setMember(false);
    } else {
      await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: userId,
        role: "member",
      });
      setMember(true);
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
        member
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {loading ? "..." : member ? "ចាកចេញ" : "ចូលរួម"}
    </button>
  );
}
