import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import PostCard from "@/components/PostCard";
import type { Post } from "@/types/database";
import Image from "next/image";
import FollowButton from "@/components/FollowButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import VideoCallButton from "@/components/call/VideoCallButton";
import Link from "next/link";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (id, username, full_name, avatar_url, is_verified),
      likes (id, user_id),
      comments (id)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const formattedPosts: Post[] = (posts || []).map((post: any) => ({
    ...post,
    likes_count: post.likes?.length || 0,
    comments_count: post.comments?.length || 0,
    is_liked: post.likes?.some((l: any) => l.user_id === user?.id) || false,
  }));

  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  let isFollowing = false;
  if (user && user.id !== profile.id) {
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!data;
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt="" width={96} height={96} className="object-cover" />
            ) : (
              profile.full_name?.[0] || "?"
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold dark:text-white">{profile.full_name}</h1>
              {profile.is_verified && <VerifiedBadge size={20} />}
            </div>
            <p className="text-slate-500">@{profile.username}</p>
            {profile.bio && <p className="mt-2 text-slate-700 dark:text-slate-300">{profile.bio}</p>}
            {profile.location && (
              <p className="text-sm text-slate-500 mt-1">📍 {profile.location}</p>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener" className="text-sm text-blue-600 hover:underline">
                🔗 {profile.website}
              </a>
            )}

            <div className="flex gap-6 mt-4 text-sm">
              <div><span className="font-semibold">{formattedPosts.length}</span> ប្រកាស</div>
              <div><span className="font-semibold">{followersCount || 0}</span> អ្នកតាម</div>
              <div><span className="font-semibold">{followingCount || 0}</span> កំពុងតាម</div>
            </div>

            <div className="mt-4 flex gap-2 flex-wrap">
              {isOwnProfile ? (
                <Link
                  href="/settings"
                  className="px-5 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  កែប្រែប្រវត្តិរូប
                </Link>
              ) : user ? (
                <>
                  <FollowButton
                    currentUserId={user.id}
                    targetUserId={profile.id}
                    initialFollowing={isFollowing}
                  />
                  <VideoCallButton
                    currentUserId={user.id}
                    targetUserId={profile.id}
                    targetName={profile.full_name || profile.username}
                  />
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {formattedPosts.length === 0 ? (
          <p className="text-center text-slate-500 py-8">មិនទាន់មានប្រកាសទេ</p>
        ) : (
          formattedPosts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id || ""} />
          ))
        )}
      </div>
    </div>
  );
}
