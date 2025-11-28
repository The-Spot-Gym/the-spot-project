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
    const searchQueries = [
      'gym',
      'fitness center',
      '24 hour fitness',
      'YMCA',
      'health club',
      'crossfit'
    ];

    const allPlaces = new Map();
    
    console.log('Fetching gyms from Google Places API...');

    // Fetch all queries in parallel for better performance
    const fetchPromises = searchQueries.map(async (query) => {
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${latitude},${longitude}&radius=${radius}&key=${googleApiKey}`;
      
      try {
        const response = await fetch(textSearchUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          return data.results;
        } else if (data.status !== 'ZERO_RESULTS') {
          console.error('Google Places API error for', query, ':', data.status, data.error_message);
        }
        return [];
      } catch (error) {
        console.error('Error fetching for query', query, ':', error);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    
    // Combine all results and deduplicate
    for (const placeList of results) {
      for (const place of placeList) {
        if (!allPlaces.has(place.place_id)) {
          allPlaces.set(place.place_id, place);
        }
      }
    }

    console.log(`Found ${allPlaces.size} unique gyms`);

    // Prepare all gym data
    const gymDataArray = Array.from(allPlaces.values()).map(place => ({
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
    }));

    // Batch upsert all gyms at once for better performance
    const { data: gyms, error: upsertError } = await supabase
      .from('gyms')
      .upsert(gymDataArray, { onConflict: 'google_place_id' })
      .select();

    if (upsertError) {
      console.error('Error upserting gyms:', upsertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save gyms to database' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully processed ${gyms?.length || 0} gyms`);

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
