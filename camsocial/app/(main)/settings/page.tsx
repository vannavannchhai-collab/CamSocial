import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EditProfileForm from "@/components/EditProfileForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/feed");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">កែប្រែប្រវត្តិរូប</h1>
      <EditProfileForm profile={profile} />
    </div>
  );
}
