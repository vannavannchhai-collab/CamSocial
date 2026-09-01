"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function CreateGroupButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);

    const { data: group, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        privacy,
        creator_id: userId,
      })
      .select()
      .single();

    if (!error && group) {
      // Add creator as admin
      await supabase.from("group_members").insert({
        group_id: group.id,
        user_id: userId,
        role: "admin",
      });

      router.push(`/groups/${group.id}`);
      router.refresh();
    }

    setLoading(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
      >
        <Plus size={16} />
        បង្កើតក្រុម
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4">បង្កើតក្រុមថ្មី</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ឈ្មោះក្រុម</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ឈ្មោះក្រុម"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ការពិពណ៌នា</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="អំពីក្រុមនេះ..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ភាពឯកជន</label>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="public">សាធារណៈ</option>
                  <option value="private">ឯកជន</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "កំពុងបង្កើត..." : "បង្កើត"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
