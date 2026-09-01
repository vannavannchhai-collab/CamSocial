import { createClient } from "@/lib/supabase/server";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types/database";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch posts with profile, likes count, and whether current user liked
  const { data: posts } = await supabase
    .from("posts")
    .select(
      `
      *,
      profiles (id, username, full_name, avatar_url),
      likes (id, user_id),
      comments (id)
    `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const formattedPosts: Post[] = (posts || []).map((post: any) => ({
    ...post,
    likes_count: post.likes?.length || 0,
    comments_count: post.comments?.length || 0,
    is_liked: post.likes?.some((l: any) => l.user_id === user.id) || false,
  }));

  return (
    <div>
      <CreatePost userId={user.id} />

      <div className="space-y-4">
        {formattedPosts.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p className="text-lg">មិនទាន់មានប្រកាសទេ</p>
            <p className="text-sm mt-1">សូមបង្ហោះអ្វីមួយដើម្បីចាប់ផ្តើម!</p>
          </div>
        ) : (
          formattedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user.id} />
          ))
        )}
      </div>
    </div>
  );
}
