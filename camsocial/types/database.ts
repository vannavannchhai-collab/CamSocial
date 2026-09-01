export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
};

export type Post = {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  group_id?: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
};

export type Like = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

export type Conversation = {
  id: string;
  is_group: boolean;
  name: string | null;
  created_at: string;
  updated_at: string;
  participants?: Profile[];
  last_message?: Message;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  image_url: string | null;
  created_at: string;
  profiles?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: "like" | "comment" | "follow" | "message" | "group_invite";
  entity_id: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  actor?: Profile;
};

export type Group = {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  avatar_url: string | null;
  creator_id: string | null;
  privacy: "public" | "private";
  created_at: string;
  updated_at: string;
  members_count?: number;
  is_member?: boolean;
};

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: "image" | "video";
  caption: string | null;
  expires_at: string;
  created_at: string;
  profiles?: Profile;
  viewed?: boolean;
};

export type VideoCall = {
  id: string;
  caller_id: string;
  receiver_id: string | null;
  call_type: "video" | "voice";
  is_group: boolean;
  conversation_id: string | null;
  group_name: string | null;
  status: "ringing" | "accepted" | "rejected" | "ended" | "missed";
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  caller?: Profile;
  receiver?: Profile;
};
