-- =============================================
-- CamSocial Schema v2 - Full Features
-- Run AFTER the original schema.sql
-- =============================================

-- 6. Conversations (for Messaging)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  is_group BOOLEAN DEFAULT FALSE,
  name TEXT, -- for group chats
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Conversation Participants
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- 8. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- receiver
  actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- who did the action
  type TEXT NOT NULL, -- 'like', 'comment', 'follow', 'message', 'group_invite'
  entity_id UUID, -- post_id, comment_id, etc.
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  avatar_url TEXT,
  creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  privacy TEXT DEFAULT 'public', -- 'public' | 'private'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Group Members
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member', -- 'admin' | 'moderator' | 'member'
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 12. Group Posts (optional - can reuse posts table with group_id)
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- 13. Stories
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  media_url TEXT NOT NULL,
  media_type TEXT DEFAULT 'image', -- 'image' | 'video'
  caption TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Story Views
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(story_id, viewer_id)
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS group_members_group_id_idx ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS stories_user_id_idx ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS stories_expires_at_idx ON public.stories(expires_at);

-- =============================================
-- RLS Policies
-- =============================================
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

-- Conversations
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

-- Participants
CREATE POLICY "Users can view participants of their conversations"
  ON public.conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join conversations"
  ON public.conversation_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Messages
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants
      WHERE conversation_id = messages.conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Groups
CREATE POLICY "Public groups are viewable by everyone"
  ON public.groups FOR SELECT
  USING (privacy = 'public' OR EXISTS (
    SELECT 1 FROM public.group_members WHERE group_id = id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members
      WHERE group_id = id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Group Members
CREATE POLICY "Members can view group members"
  ON public.group_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join public groups"
  ON public.group_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Stories
CREATE POLICY "Stories are viewable by everyone (not expired)"
  ON public.stories FOR SELECT
  USING (expires_at > NOW());

CREATE POLICY "Users can create stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = user_id);

-- Story Views
CREATE POLICY "Users can view story views"
  ON public.story_views FOR SELECT
  USING (true);

CREATE POLICY "Users can mark stories as viewed"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- =============================================
-- Enable Realtime
-- =============================================
-- In Supabase Dashboard > Database > Replication:
-- Enable realtime for: messages, notifications, likes, comments, posts

-- =============================================
-- Additional: Verified Badge + Profile enhancements
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- Index for search
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_full_name_idx ON public.profiles(full_name);

-- =============================================
-- Video Calls
-- =============================================
CREATE TABLE IF NOT EXISTS public.video_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'ringing', -- ringing | accepted | rejected | ended | missed
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS video_calls_caller_id_idx ON public.video_calls(caller_id);
CREATE INDEX IF NOT EXISTS video_calls_receiver_id_idx ON public.video_calls(receiver_id);
CREATE INDEX IF NOT EXISTS video_calls_status_idx ON public.video_calls(status);

ALTER TABLE public.video_calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own calls"
  ON public.video_calls FOR SELECT
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create calls"
  ON public.video_calls FOR INSERT
  WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update their calls"
  ON public.video_calls FOR UPDATE
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

-- =============================================
-- Enhanced Video / Voice / Group Calls
-- =============================================

-- Add call type and group support
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS call_type TEXT DEFAULT 'video'; -- video | voice
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL;
ALTER TABLE public.video_calls ADD COLUMN IF NOT EXISTS group_name TEXT;

-- Call participants (for group calls)
CREATE TABLE IF NOT EXISTS public.call_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES public.video_calls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  UNIQUE(call_id, user_id)
);

CREATE INDEX IF NOT EXISTS call_participants_call_id_idx ON public.call_participants(call_id);

ALTER TABLE public.call_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view call participants"
  ON public.call_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join calls"
  ON public.call_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave calls"
  ON public.call_participants FOR UPDATE
  USING (auth.uid() = user_id);
