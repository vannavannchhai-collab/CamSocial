"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FollowButton({
  currentUserId,
  targetUserId,
  initialFollowing,
}: {
  currentUserId: string;
  targetUserId: string;
  initialFollowing: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleFollow = async () => {
    setLoading(true);

    if (following) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId);
      setFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId,
        following_id: targetUserId,
      });
      setFollowing(true);
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-5 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50 ${
        following
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
          : "bg-blue-600 text-white hover:bg-blue-700"
      }`}
    >
      {loading ? "..." : following ? "កំពុងតាម" : "តាមដាន"}
    </button>
  );
}
