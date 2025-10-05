import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get the current user from the request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Create a test user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: `test.friend.${Date.now()}@gym-buddy.app`,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: {
        username: 'alex_fitness',
        display_name: 'Alex Thompson'
      }
    });

    if (createError) throw createError;

    // Update the profile with additional info
    await supabaseAdmin
      .from('profiles')
      .update({
        avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        bio: 'Fitness enthusiast | Powerlifter | Early bird 🏋️'
      })
      .eq('user_id', newUser.user.id);

    // Create bidirectional friendship
    await supabaseAdmin.from('friendships').insert([
      {
        user_id: user.id,
        friend_id: newUser.user.id,
        status: 'accepted'
      },
      {
        user_id: newUser.user.id,
        friend_id: user.id,
        status: 'accepted'
      }
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        friend: {
          id: newUser.user.id,
          username: 'alex_fitness',
          display_name: 'Alex Thompson'
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
