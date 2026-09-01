import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreatePost from "@/components/CreatePost";

export default async function NewPostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">បង្ហោះប្រកាសថ្មី</h1>
      <CreatePost userId={user.id} />
    </div>
  );
}
