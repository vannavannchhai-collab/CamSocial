"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import type { Message, Profile } from "@/types/database";
import { Send } from "lucide-react";
import VideoCallButton from "@/components/call/VideoCallButton";
import GroupCallButton from "@/components/call/GroupCallButton";

export default function ChatRoom({
  conversationId,
  currentUserId,
  initialMessages,
  otherUser,
  isGroup,
  groupName,
  participantIds = [],
}: {
  conversationId: string;
  currentUserId: string;
  initialMessages: Message[];
  otherUser?: Profile;
  isGroup: boolean;
  groupName?: string | null;
  participantIds?: string[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const { data } = await supabase
            .from("messages")
            .select("*, profiles(id, username, full_name, avatar_url)")
            .eq("id", payload.new.id)
            .single();

          if (data) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.id)) return prev;
              return [...prev, data];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setLoading(true);
    const content = newMessage.trim();
    setNewMessage("");

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold">
            {isGroup ? groupName?.[0] || "G" : otherUser?.full_name?.[0] || "?"}
          </div>
          <div>
            <p className="font-semibold dark:text-white">
              {isGroup ? groupName : otherUser?.full_name || otherUser?.username}
            </p>
            <p className="text-xs text-slate-500">
              {isGroup ? "Group Chat" : `@${otherUser?.username}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isGroup && otherUser && (
            <VideoCallButton
              currentUserId={currentUserId}
              targetUserId={otherUser.id}
              targetName={otherUser.full_name || otherUser.username}
            />
          )}
          {isGroup && participantIds.length > 0 && (
            <GroupCallButton
              currentUserId={currentUserId}
              conversationId={conversationId}
              participantIds={participantIds}
              groupName={groupName || undefined}
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMine
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-md"
                }`}
              >
                {!isMine && isGroup && (
                  <p className="text-xs font-semibold mb-1 opacity-70">{msg.profiles?.full_name}</p>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                  {formatDate(msg.created_at)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="សរសេរសារ..."
          className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !newMessage.trim()}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
