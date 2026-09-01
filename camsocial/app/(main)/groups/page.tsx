import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import CreateGroupButton from "@/components/CreateGroupButton";

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: groups } = await supabase
    .from("groups")
    .select(`
      *,
      group_members (id)
    `)
    .order("created_at", { ascending: false });

  const formatted = (groups || []).map((g: any) => ({
    ...g,
    members_count: g.group_members?.length || 0,
  }));

  // Groups the user is in
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const myGroupIds = new Set(myMemberships?.map((m) => m.group_id) || []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">ក្រុម</h1>
        <CreateGroupButton userId={user.id} />
      </div>

      <div className="grid gap-4">
        {formatted.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl">
            <p>មិនទាន់មានក្រុមទេ</p>
            <p className="text-sm mt-1">បង្កើតក្រុមថ្មីឥឡូវនេះ!</p>
          </div>
        ) : (
          formatted.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-bold shrink-0">
                  {group.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{group.name}</h2>
                    {myGroupIds.has(group.id) && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                        សមាជិក
                      </span>
                    )}
                  </div>
                  {group.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    {group.members_count} សមាជិក · {group.privacy === "public" ? "សាធារណៈ" : "ឯកជន"}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
