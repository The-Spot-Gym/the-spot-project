
-- Ensure conversations INSERT is allowed for creator
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Harden SELECT policy for conversations (already added via function) - keep as is
-- Ensure participants INSERT policy exists for conversation creators
DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants"
ON public.conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
      AND c.created_by = auth.uid()
  )
);
