"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function StartChatButton({ currentUserId }: { currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const searchUsers = async (q: string) => {
    setSearch(q);
    if (q.length < 2) {
      setUsers([]);
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
      .neq("id", currentUserId)
      .limit(8);

    setUsers(data || []);
  };

  const startChat = async (targetUserId: string) => {
    setLoading(true);

    // Check if conversation already exists between these two users
    const { data: myConvs } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", currentUserId);

    const myConvIds = myConvs?.map((c) => c.conversation_id) || [];

    if (myConvIds.length > 0) {
      const { data: existing } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", targetUserId)
        .in("conversation_id", myConvIds);

      if (existing && existing.length > 0) {
        // Found existing 1-1 conversation
        router.push(`/messages/${existing[0].conversation_id}`);
        setLoading(false);
        return;
      }
    }

    // Create new conversation
    const { data: conv, error } = await supabase
      .from("conversations")
      .insert({ is_group: false })
      .select()
      .single();

    if (error || !conv) {
      setLoading(false);
      return;
    }

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, user_id: currentUserId },
      { conversation_id: conv.id, user_id: targetUserId },
    ]);

    router.push(`/messages/${conv.id}`);
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
      >
        <Plus size={16} />
        ជជែកថ្មី
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">ចាប់ផ្តើមជជែក</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <input
              type="text"
              value={search}
              onChange={(e) => searchUsers(e.target.value)}
              placeholder="ស្វែងរកអ្នកប្រើ..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              autoFocus
            />

            <div className="max-h-60 overflow-y-auto space-y-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startChat(u.id)}
                  disabled={loading}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                    {u.full_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-sm text-slate-500">@{u.username}</p>
                  </div>
                </button>
              ))}
              {search.length >= 2 && users.length === 0 && (
                <p className="text-center text-slate-400 py-4 text-sm">រកមិនឃើញ</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
