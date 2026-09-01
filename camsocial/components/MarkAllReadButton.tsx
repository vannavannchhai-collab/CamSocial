"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function MarkAllReadButton({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const handleMarkAll = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    router.refresh();
  };

  return (
    <button
      onClick={handleMarkAll}
      className="text-sm text-blue-600 hover:underline"
    >
      សម្គាល់ថាបានអានទាំងអស់
    </button>
  );
}
