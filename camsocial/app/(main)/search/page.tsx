"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import VerifiedBadge from "@/components/VerifiedBadge";
import { Search as SearchIcon } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, is_verified")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(20);
      setResults(data || []);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">ស្វែងរក</h1>

      <div className="relative mb-6">
        <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ស្វែងរកអ្នកប្រើ..."
          className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          autoFocus
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {loading && (
          <p className="text-center py-8 text-slate-400">កំពុងស្វែងរក...</p>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <p className="text-center py-8 text-slate-400">រកមិនឃើញ</p>
        )}

        {results.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.username}`}
            className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 transition"
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold overflow-hidden shrink-0">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                user.full_name?.[0] || "?"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="font-semibold truncate dark:text-white">{user.full_name}</p>
                {user.is_verified && <VerifiedBadge size={14} />}
              </div>
              <p className="text-sm text-slate-500">@{user.username}</p>
              {user.bio && (
                <p className="text-sm text-slate-400 truncate mt-0.5">{user.bio}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
