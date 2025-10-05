import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { latitude, longitude, radius = 5000 } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ error: 'Latitude and longitude are required' }),
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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call Google Places API - Text Search for better results
    // Using text search with multiple queries to catch different types of fitness facilities
    const searchQueries = [
      'gym',
      'fitness center',
      '24 hour fitness',
      'YMCA',
      'health club',
      'crossfit'
    ];

    const allPlaces = new Map(); // Use Map to avoid duplicates by place_id
    
    console.log('Fetching gyms from Google Places API...');

    // Search with text queries for more comprehensive results
    for (const query of searchQueries) {
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&key=${googleApiKey}`;
      
      const response = await fetch(textSearchUrl);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          // Only add if we haven't seen this place before
          if (!allPlaces.has(place.place_id)) {
            allPlaces.set(place.place_id, place);
          }
        }
      } else if (data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
      }
    }

    console.log(`Found ${allPlaces.size} unique gyms`);

    const gyms = [];

    // Process each gym result
    for (const place of Array.from(allPlaces.values())) {
      const gymData = {
        google_place_id: place.place_id,
        name: place.name,
        address: place.vicinity || place.formatted_address,
        rating: place.rating || null,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        user_ratings_total: place.user_ratings_total || null,
        photo_url: place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleApiKey}`
          : null,
      };

      // Upsert gym data into database
      const { data, error } = await supabase
        .from('gyms')
        .upsert(gymData, { onConflict: 'google_place_id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting gym:', error);
      } else {
        gyms.push(data);
      }
    }

    console.log(`Successfully processed ${gyms.length} gyms`);

    return new Response(
      JSON.stringify({ gyms }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-nearby-gyms function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
