import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/Navbar";
import IncomingCallListener from "@/components/call/IncomingCallListener";
import { redirect } from "next/navigation";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar username={profile?.username} />
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
      <IncomingCallListener userId={user.id} />
    </div>
  );
}
