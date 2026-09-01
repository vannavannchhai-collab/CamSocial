"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Home, User, LogOut, PlusSquare, MessageCircle, Bell,
  Users, Camera, Search, Settings, Moon, Sun
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "./ThemeProvider";

export default function Navbar({ username }: { username?: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const loadUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count || 0);
    };

    loadUnread();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        () => loadUnread()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/feed" className="text-xl font-bold text-blue-600">
          CamSocial
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/feed" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Feed">
            <Home size={20} />
          </Link>

          <Link href="/search" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Search">
            <Search size={20} />
          </Link>

          <Link href="/stories" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Stories">
            <Camera size={20} />
          </Link>

          <Link href="/messages" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Messages">
            <MessageCircle size={20} />
          </Link>

          <Link href="/notifications" className="relative text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Notifications">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link href="/groups" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Groups">
            <Users size={20} />
          </Link>

          <Link href="/post/new" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="បង្ហោះ">
            <PlusSquare size={20} />
          </Link>

          <Link href="/settings" className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition" title="Settings">
            <Settings size={20} />
          </Link>

          <button
            onClick={toggleTheme}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
            title="Dark Mode"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <Link
            href={username ? `/profile/${username}` : "/settings"}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
            title="Profile"
          >
            <User size={20} />
          </Link>

          <button onClick={handleLogout} className="text-slate-600 dark:text-slate-300 hover:text-red-500 transition" title="ចាកចេញ">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
}
