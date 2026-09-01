"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types/database";
import { Camera } from "lucide-react";

export default function EditProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.full_name || "");
  const [username, setUsername] = useState(profile.username || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [location, setLocation] = useState(profile.location || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(profile.avatar_url);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    let avatarUrl = profile.avatar_url;

    if (avatar) {
      const ext = avatar.name.split(".").pop();
      const fileName = `avatars/${profile.id}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, avatar, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from("posts")
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim() || null,
        website: website.trim() || null,
        location: location.trim() || null,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("រក្សាទុកបានជោគជ័យ!");
      router.refresh();
      setTimeout(() => router.push(`/profile/${username.trim().toLowerCase()}`), 1000);
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-3xl font-bold text-blue-600 overflow-hidden">
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              fullName?.[0] || "?"
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700">
            <Camera size={14} />
            <input type="file" accept="image/*" onChange={handleAvatar} className="hidden" />
          </label>
        </div>
        <p className="text-sm text-slate-500">ផ្លាស់ប្តូររូបភាព</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-200">ឈ្មោះពេញ</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-200">ឈ្មោះអ្នកប្រើ</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-200">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="អំពីខ្ញុំ..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-200">គេហទំព័រ</label>
        <input
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1 dark:text-slate-200">ទីតាំង</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ភ្នំពេញ, កម្ពុជា"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.includes("ជោគជ័យ") ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 transition"
      >
        {loading ? "កំពុងរក្សាទុក..." : "រក្សាទុក"}
      </button>
    </form>
  );
}
