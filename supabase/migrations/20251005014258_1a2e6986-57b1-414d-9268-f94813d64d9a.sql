-- Fix conversations SELECT policy to allow creators to see their own rows immediately
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (
  created_by = auth.uid() OR public.is_conversation_participant(id, auth.uid())
);