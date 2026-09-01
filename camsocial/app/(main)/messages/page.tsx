import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import StartChatButton from "@/components/chat/StartChatButton";

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get conversations the user is in
  const { data: participations } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", user.id);

  const conversationIds = participations?.map((p) => p.conversation_id) || [];

  let conversations: any[] = [];

  if (conversationIds.length > 0) {
    const { data } = await supabase
      .from("conversations")
      .select(`
        *,
        conversation_participants (
          user_id,
          profiles (id, username, full_name, avatar_url)
        )
      `)
      .in("id", conversationIds)
      .order("updated_at", { ascending: false });

    // Get last message for each
    conversations = await Promise.all(
      (data || []).map(async (conv) => {
        const { data: lastMsg } = await supabase
          .from("messages")
          .select("content, created_at, sender_id")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        // Find the other participant (for 1-1 chat)
        const other = conv.conversation_participants?.find(
          (p: any) => p.user_id !== user.id
        );

        return {
          ...conv,
          last_message: lastMsg,
          other_user: other?.profiles,
        };
      })
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">សារ</h1>
        <StartChatButton currentUserId={user.id} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {conversations.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p>មិនទាន់មានការសន្ទនាទេ</p>
            <p className="text-sm mt-1">ចាប់ផ្តើមជជែកជាមួយមិត្តភក្តិ!</p>
          </div>
        ) : (
          conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 p-4 hover:bg-slate-50 border-b border-slate-50 transition"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold shrink-0">
                {conv.is_group
                  ? conv.name?.[0] || "G"
                  : conv.other_user?.full_name?.[0] || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {conv.is_group
                    ? conv.name
                    : conv.other_user?.full_name || conv.other_user?.username}
                </p>
                {conv.last_message && (
                  <p className="text-sm text-slate-500 truncate">
                    {conv.last_message.content}
                  </p>
                )}
              </div>
              {conv.last_message && (
                <span className="text-xs text-slate-400 shrink-0">
                  {formatDate(conv.last_message.created_at)}
                </span>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
