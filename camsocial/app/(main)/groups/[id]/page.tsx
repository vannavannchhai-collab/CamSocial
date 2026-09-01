import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import JoinGroupButton from "@/components/JoinGroupButton";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types/database";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: group } = await supabase
    .from("groups")
    .select("*")
    .eq("id", id)
    .single();

  if (!group) notFound();

  // Members
  const { data: members } = await supabase
    .from("group_members")
    .select("*, profiles(id, username, full_name, avatar_url)")
    .eq("group_id", id);

  const isMember = members?.some((m) => m.user_id === user.id) || false;

  // Posts in this group
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (id, username, full_name, avatar_url),
      likes (id, user_id),
      comments (id)
    `)
    .eq("group_id", id)
    .order("created_at", { ascending: false });

  const formattedPosts: Post[] = (posts || []).map((post: any) => ({
    ...post,
    likes_count: post.likes?.length || 0,
    comments_count: post.comments?.length || 0,
    is_liked: post.likes?.some((l: any) => l.user_id === user.id) || false,
  }));

  return (
    <div>
      {/* Group Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <div className="p-5 -mt-8">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 rounded-xl bg-white border-4 border-white shadow flex items-center justify-center text-2xl font-bold text-indigo-600">
              {group.name[0]}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold">{group.name}</h1>
              <p className="text-sm text-slate-500">
                {members?.length || 0} សមាជិក · {group.privacy === "public" ? "សាធារណៈ" : "ឯកជន"}
              </p>
            </div>
            <JoinGroupButton
              groupId={id}
              userId={user.id}
              isMember={isMember}
            />
          </div>
          {group.description && (
            <p className="mt-4 text-slate-700">{group.description}</p>
          )}
        </div>
      </div>

      {/* Posts */}
      <h2 className="font-semibold text-lg mb-4">ប្រកាសក្នុងក្រុម</h2>
      <div className="space-y-4">
        {formattedPosts.length === 0 ? (
          <p className="text-center text-slate-500 py-8">មិនទាន់មានប្រកាសទេ</p>
        ) : (
          formattedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))
        )}
      </div>
    </div>
  );
}
