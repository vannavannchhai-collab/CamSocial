"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

export default function StoryViewer({
  userStories,
  startIndex,
  onClose,
  currentUserId,
}: {
  userStories: any[];
  startIndex: number;
  onClose: () => void;
  currentUserId: string;
}) {
  const [userIndex, setUserIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const supabase = createClient();

  const currentUserStories = userStories[userIndex];
  const currentStory = currentUserStories?.stories[storyIndex];

  useEffect(() => {
    if (!currentStory) return;

    // Mark as viewed
    supabase.from("story_views").upsert({
      story_id: currentStory.id,
      viewer_id: currentUserId,
    });

    // Auto advance after 5 seconds
    const timer = setTimeout(() => {
      if (storyIndex < currentUserStories.stories.length - 1) {
        setStoryIndex((i) => i + 1);
      } else if (userIndex < userStories.length - 1) {
        setUserIndex((i) => i + 1);
        setStoryIndex(0);
      } else {
        onClose();
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [userIndex, storyIndex]);

  if (!currentStory) return null;

  const handleClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width / 3) {
      // Previous
      if (storyIndex > 0) {
        setStoryIndex((i) => i - 1);
      } else if (userIndex > 0) {
        setUserIndex((i) => i - 1);
        setStoryIndex(userStories[userIndex - 1].stories.length - 1);
      }
    } else {
      // Next
      if (storyIndex < currentUserStories.stories.length - 1) {
        setStoryIndex((i) => i + 1);
      } else if (userIndex < userStories.length - 1) {
        setUserIndex((i) => i + 1);
        setStoryIndex(0);
      } else {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white z-10"
      >
        <X size={28} />
      </button>

      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {currentUserStories.stories.map((_: any, i: number) => (
          <div key={i} className="flex-1 h-0.5 bg-white/30 rounded overflow-hidden">
            <div
              className={`h-full bg-white transition-all ${
                i < storyIndex ? "w-full" : i === storyIndex ? "animate-progress" : "w-0"
              }`}
              style={i === storyIndex ? { animation: "progress 5s linear" } : {}}
            />
          </div>
        ))}
      </div>

      {/* User info */}
      <div className="absolute top-8 left-4 flex items-center gap-2 z-10">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">
          {currentUserStories.profile?.full_name?.[0]}
        </div>
        <span className="text-white text-sm font-medium">
          {currentUserStories.profile?.full_name}
        </span>
      </div>

      <div className="w-full max-w-md h-full max-h-[90vh] relative" onClick={handleClick}>
        <img
          src={currentStory.media_url}
          alt=""
          className="w-full h-full object-contain"
        />
        {currentStory.caption && (
          <p className="absolute bottom-8 left-0 right-0 text-center text-white text-lg px-4">
            {currentStory.caption}
          </p>
        )}
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
