import { createClient } from "@/lib/supabase/server";
import StoriesBar from "@/components/stories/StoriesBar";
import CreateStoryButton from "@/components/stories/CreateStoryButton";

export default async function StoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get active stories (not expired)
  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (id, username, full_name, avatar_url)
    `)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  // Group by user
  const storiesByUser: Record<string, any[]> = {};
  (stories || []).forEach((s: any) => {
    if (!storiesByUser[s.user_id]) storiesByUser[s.user_id] = [];
    storiesByUser[s.user_id].push(s);
  });

  const userStories = Object.entries(storiesByUser).map(([userId, userStoryList]) => ({
    userId,
    profile: userStoryList[0].profiles,
    stories: userStoryList,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stories</h1>
        <CreateStoryButton userId={user.id} />
      </div>

      <StoriesBar userStories={userStories} currentUserId={user.id} />

      {userStories.length === 0 && (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl mt-6">
          <p>មិនទាន់មាន Story ទេ</p>
          <p className="text-sm mt-1">បង្កើត Story ដំបូងរបស់អ្នក!</p>
        </div>
      )}
    </div>
  );
}
