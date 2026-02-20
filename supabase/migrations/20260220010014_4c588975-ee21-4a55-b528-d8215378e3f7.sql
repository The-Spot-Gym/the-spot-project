
-- Allow users to delete friendships (unfriend or cancel requests)
CREATE POLICY "Users can delete their friendships"
ON public.friendships FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Allow users to leave conversations
CREATE POLICY "Users can leave conversations"
ON public.conversation_participants FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own gym visits
CREATE POLICY "Users can delete their own gym visits"
ON public.gym_visits FOR DELETE
USING (auth.uid() = user_id);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.messages FOR DELETE
USING (auth.uid() = sender_id);
