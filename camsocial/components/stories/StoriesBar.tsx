"use client";

import { useState } from "react";
import StoryViewer from "./StoryViewer";

export default function StoriesBar({
  userStories,
  currentUserId,
}: {
  userStories: any[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {userStories.map((us, idx) => (
          <button
            key={us.userId}
            onClick={() => setSelected(idx)}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <div className="w-16 h-16 rounded-full p-[3px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
              <div className="w-full h-full rounded-full bg-white p-[2px]">
                <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg overflow-hidden">
                  {us.profile?.avatar_url ? (
                    <img
                      src={us.profile.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    us.profile?.full_name?.[0] || "?"
                  )}
                </div>
              </div>
            </div>
            <span className="text-xs text-slate-600 max-w-[64px] truncate">
              {us.userId === currentUserId
                ? "អ្នក"
                : us.profile?.username}
            </span>
          </button>
        ))}
      </div>

      {selected !== null && (
        <StoryViewer
          userStories={userStories}
          startIndex={selected}
          onClose={() => setSelected(null)}
          currentUserId={currentUserId}
        />
      )}
    </>
  );
}
