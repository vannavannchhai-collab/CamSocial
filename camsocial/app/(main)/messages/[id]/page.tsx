import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChatRoom from "@/components/chat/ChatRoom";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: participation } = await supabase
    .from("conversation_participants")
    .select("*")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!participation) notFound();

  const { data: conversation } = await supabase
    .from("conversations")
    .select(`
      *,
      conversation_participants (
        user_id,
        profiles (id, username, full_name, avatar_url)
      )
    `)
    .eq("id", id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select(`*, profiles (id, username, full_name, avatar_url)`)
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const otherUser = conversation.conversation_participants?.find(
    (p: any) => p.user_id !== user.id
  )?.profiles;

  const participantIds = conversation.conversation_participants?.map(
    (p: any) => p.user_id
  ) || [];

  return (
    <ChatRoom
      conversationId={id}
      currentUserId={user.id}
      initialMessages={messages || []}
      otherUser={otherUser}
      isGroup={conversation.is_group}
      groupName={conversation.name}
      participantIds={participantIds}
    />
  );
}
