-- Enable full row tracking for realtime updates
ALTER TABLE public.messages REPLICA IDENTITY FULL;