import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import MarkAllReadButton from "@/components/MarkAllReadButton";
import Link from "next/link";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: notifications } = await supabase
    .from("notifications")
    .select(`
      *,
      actor:profiles!notifications_actor_id_fkey (id, username, full_name, avatar_url)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // Mark as read when viewing (optional - can be done client-side)
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  const typeLabel: Record<string, string> = {
    like: "ចូលចិត្តប្រកាសរបស់អ្នក",
    comment: "បានផ្តល់មតិលើប្រកាសរបស់អ្នក",
    follow: "បានតាមដានអ្នក",
    message: "បានផ្ញើសារមកអ្នក",
    group_invite: "បានអញ្ជើញអ្នកចូលក្រុម",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ការជូនដំណឹង</h1>
        <MarkAllReadButton userId={user.id} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {!notifications || notifications.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>មិនទាន់មានការជូនដំណឹងទេ</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div
              key={n.id}
              className={`flex items-center gap-3 p-4 border-b border-slate-50 ${
                !n.is_read ? "bg-blue-50" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                {n.actor?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link
                    href={`/profile/${n.actor?.username}`}
                    className="font-semibold hover:underline"
                  >
                    {n.actor?.full_name || n.actor?.username}
                  </Link>{" "}
                  {typeLabel[n.type] || n.message}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(n.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
