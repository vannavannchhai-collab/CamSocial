"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

export default function CreateStoryButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);

    const ext = file.name.split(".").pop();
    const fileName = `stories/${userId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("posts")
      .upload(fileName, file);

    if (uploadError) {
      console.error(uploadError);
      setLoading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("posts")
      .getPublicUrl(fileName);

    await supabase.from("stories").insert({
      user_id: userId,
      media_url: publicUrl,
      media_type: file.type.startsWith("video") ? "video" : "image",
      caption: caption.trim() || null,
    });

    setLoading(false);
    setOpen(false);
    setFile(null);
    setPreview(null);
    setCaption("");
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
      >
        <Plus size={16} />
        បង្កើត Story
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">បង្កើត Story</h2>
              <button onClick={() => setOpen(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!preview ? (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 transition">
                  <Plus size={32} className="text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500">ជ្រើសរូបភាព ឬ វីដេអូ</span>
                  <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
                </label>
              ) : (
                <div className="relative">
                  <img src={preview} alt="" className="w-full max-h-64 object-contain rounded-xl" />
                  <button
                    type="button"
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (ជម្រើស)"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? "កំពុងបង្ហោះ..." : "បង្ហោះ Story"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
