-- Enable realtime for leaderboard_stats table
ALTER TABLE public.leaderboard_stats REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.leaderboard_stats;