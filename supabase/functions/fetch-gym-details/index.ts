import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { gymId } = await req.json();

    if (!gymId) {
      return new Response(
        JSON.stringify({ error: 'Gym ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!googleApiKey) {
      console.error('GOOGLE_MAPS_API_KEY not set');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Service role client for DB operations
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch gym from database to get google_place_id
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('*')
      .eq('id', gymId)
      .single();

    if (gymError || !gym) {
      console.error('Error fetching gym from database:', gymError);
      return new Response(
        JSON.stringify({ error: 'Gym not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Places API - Place Details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${gym.google_place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,reviews,photos,geometry&key=${googleApiKey}`;
    
    console.log('Fetching gym details from Google Places API...');
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    if (detailsData.status !== 'OK') {
      console.error('Google Places API error:', detailsData.status, detailsData.error_message);
      return new Response(
        JSON.stringify({ error: `Google Places API error: ${detailsData.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const place = detailsData.result;

    // Process photos
    const photos = place.photos?.slice(0, 5).map((photo: any) => 
      `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${googleApiKey}`
    ) || [];

    // Process reviews
    const reviews = place.reviews?.map((review: any) => ({
      author_name: review.author_name,
      rating: review.rating,
      text: review.text,
      time: review.time,
      relative_time_description: review.relative_time_description,
      profile_photo_url: review.profile_photo_url,
    })) || [];

    // Update gym in database with latest info
    const updatedGymData = {
      name: place.name,
      address: place.formatted_address,
      rating: place.rating || null,
      phone_number: place.formatted_phone_number || null,
      website: place.website || null,
      user_ratings_total: place.user_ratings_total || null,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      photo_url: photos[0] || gym.photo_url,
    };

    await supabase
      .from('gyms')
      .update(updatedGymData)
      .eq('id', gymId);

    const gymDetails = {
      ...gym,
      ...updatedGymData,
      opening_hours: place.opening_hours || null,
      photos,
      reviews,
    };

    console.log('Successfully fetched gym details');

    return new Response(
      JSON.stringify({ gym: gymDetails }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-gym-details function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
