"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Sign up
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // 2. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        username: username.toLowerCase(),
        full_name: fullName,
        avatar_url: null,
        bio: null,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
    }

    router.push("/feed");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600">CamSocial</h1>
          <p className="text-slate-600 mt-2">បណ្តាញសង្គមខ្មែរ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-center mb-6">ចុះឈ្មោះ</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ឈ្មោះពេញ
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="ឈ្មោះរបស់អ្នក"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ឈ្មោះអ្នកប្រើ
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                អ៊ីមែល
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                ពាក្យសម្ងាត់
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="យ៉ាងតិច 6 តួ"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? "កំពុងចុះឈ្មោះ..." : "បង្កើតគណនី"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-600 mt-6">
            មានគណនីរួចហើយ?{" "}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              ចូលប្រើ
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
