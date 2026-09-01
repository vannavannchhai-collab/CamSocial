"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/utils";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import type { Post } from "@/types/database";
import Image from "next/image";
import Link from "next/link";
import VerifiedBadge from "./VerifiedBadge";

export default function PostCard({
  post,
  currentUserId,
}: {
  post: Post;
  currentUserId: string;
}) {
  const [liked, setLiked] = useState(post.is_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const supabase = createClient();

  const handleLike = async () => {
    if (liked) {
      await supabase.from("likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
      setLiked(false);
      setLikesCount((c) => c - 1);
    } else {
      await supabase.from("likes").insert({ post_id: post.id, user_id: currentUserId });
      setLiked(true);
      setLikesCount((c) => c + 1);

      // Create notification
      if (post.user_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: currentUserId,
          type: "like",
          entity_id: post.id,
        });
      }
    }
  };

  const loadComments = async () => {
    if (!showComments) {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(username, full_name, avatar_url, is_verified)")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true });
      setComments(data || []);
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setLoadingComment(true);
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: post.id, user_id: currentUserId, content: newComment.trim() })
      .select("*, profiles(username, full_name, avatar_url, is_verified)")
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewComment("");

      if (post.user_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: post.user_id,
          actor_id: currentUserId,
          type: "comment",
          entity_id: post.id,
        });
      }
    }
    setLoadingComment(false);
  };

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden mb-4 transition-colors">
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 font-semibold overflow-hidden">
          {post.profiles?.avatar_url ? (
            <Image src={post.profiles.avatar_url} alt="" width={40} height={40} className="object-cover" />
          ) : (
            post.profiles?.full_name?.[0] || "?"
          )}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <Link href={`/profile/${post.profiles?.username}`} className="font-semibold text-slate-900 dark:text-white hover:underline">
              {post.profiles?.full_name || post.profiles?.username}
            </Link>
            {post.profiles?.is_verified && <VerifiedBadge size={14} />}
          </div>
          <p className="text-xs text-slate-500">{formatDate(post.created_at)}</p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{post.content}</p>
      </div>

      {post.image_url && (
        <div className="relative w-full aspect-video bg-slate-100 dark:bg-slate-700">
          <Image src={post.image_url} alt="Post image" fill className="object-cover" />
        </div>
      )}

      <div className="px-4 py-2 flex items-center gap-4 text-sm text-slate-500 border-t border-slate-50 dark:border-slate-700">
        <span>{likesCount} ការចូលចិត្ត</span>
        <span>{post.comments_count || 0} មតិ</span>
      </div>

      <div className="flex border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center gap-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition ${liked ? "text-red-500" : "text-slate-600 dark:text-slate-300"}`}
        >
          <Heart size={18} fill={liked ? "currentColor" : "none"} />
          <span className="text-sm font-medium">ចូលចិត្ត</span>
        </button>
        <button onClick={loadComments} className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <MessageCircle size={18} />
          <span className="text-sm font-medium">មតិ</span>
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition">
          <Share2 size={18} />
          <span className="text-sm font-medium">ចែករំលែក</span>
        </button>
      </div>

      {showComments && (
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-semibold text-blue-600 shrink-0">
                  {c.profiles?.full_name?.[0] || "?"}
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl px-3 py-2 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold dark:text-white">{c.profiles?.full_name || c.profiles?.username}</p>
                    {c.profiles?.is_verified && <VerifiedBadge size={12} />}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="សរសេរមតិ..."
              className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={loadingComment} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              ផ្ញើ
            </button>
          </form>
        </div>
      )}
    </article>
  );
}
