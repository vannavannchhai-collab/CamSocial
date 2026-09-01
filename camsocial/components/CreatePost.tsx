"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, X } from "lucide-react";

export default function CreatePost({ userId }: { userId: string }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !image) return;

    setLoading(true);

    let imageUrl = null;

    if (image) {
      const fileExt = image.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, image);

      if (uploadError) {
        console.error(uploadError);
        setLoading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("posts").getPublicUrl(fileName);
      imageUrl = publicUrl;
    }

    const { error } = await supabase.from("posts").insert({
      user_id: userId,
      content: content.trim(),
      image_url: imageUrl,
    });

    if (!error) {
      setContent("");
      setImage(null);
      setPreview(null);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
      <form onSubmit={handleSubmit}>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="តើអ្នកកំពុងគិតអ្វី?"
          rows={3}
          className="w-full resize-none border-0 focus:ring-0 outline-none text-slate-800 placeholder:text-slate-400"
        />

        {preview && (
          <div className="relative mt-3 rounded-xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full max-h-80 object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
          <label className="cursor-pointer text-slate-500 hover:text-blue-600 transition flex items-center gap-2">
            <ImageIcon size={20} />
            <span className="text-sm">រូបភាព</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <button
            type="submit"
            disabled={loading || (!content.trim() && !image)}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {loading ? "កំពុងបង្ហោះ..." : "បង្ហោះ"}
          </button>
        </div>
      </form>
    </div>
  );
}
