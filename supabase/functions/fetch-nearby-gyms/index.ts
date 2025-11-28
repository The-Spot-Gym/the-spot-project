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

    // Helper to estimate distance in kilometers between two coordinates
    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const calculateDistanceKm = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number,
    ) => {
      const R = 6371; // Earth radius in km
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    // Prepare all gym data with validation and distance calculation
    const gymsWithDistance = Array.from(allPlaces.values())
      .filter(place => {
        // Validate required fields
        if (!place.place_id || !place.name || !place.geometry?.location?.lat || !place.geometry?.location?.lng) {
          console.warn('Skipping invalid gym data:', place.name || 'unknown');
          return false;
        }
        return true;
      })
      .map(place => {
        const distanceKm = calculateDistanceKm(
          latitude,
          longitude,
          place.geometry.location.lat,
          place.geometry.location.lng,
        );

        return {
          google_place_id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address || null,
          rating: place.rating || null,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          user_ratings_total: place.user_ratings_total || null,
          photo_url: place.photos?.[0]?.photo_reference
            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleApiKey}`
            : null,
          _distanceKm: distanceKm,
        };
      });

    // Sort by distance and limit to closest gyms to reduce database load
    const MAX_GYMS = 30;
    const limitedGymsWithDistance = gymsWithDistance
      .sort((a, b) => a._distanceKm - b._distanceKm)
      .slice(0, MAX_GYMS);

    const gymDataArray = limitedGymsWithDistance.map(({ _distanceKm, ...gym }) => gym);

    console.log(`Validated ${gymDataArray.length} gyms for database insert (limited to closest ${MAX_GYMS})`);

    // Process in smaller batches to avoid timeouts and size limits
    const BATCH_SIZE = 10;
    const allGyms = [];
    
    for (let i = 0; i < gymDataArray.length; i += BATCH_SIZE) {
      const batch = gymDataArray.slice(i, i + BATCH_SIZE);
      
      try {
        const { data: batchGyms, error: batchError } = await supabase
          .from('gyms')
          .upsert(batch, { onConflict: 'google_place_id' })
          .select();

        if (batchError) {
          console.error(`Error upserting batch ${i / BATCH_SIZE + 1}:`, batchError);
          // Continue with other batches even if one fails
          continue;
        }

        if (batchGyms) {
          allGyms.push(...batchGyms);
        }
      } catch (error) {
        console.error(`Exception in batch ${i / BATCH_SIZE + 1}:`, error);
        // Continue with other batches
      }
    }

    console.log(`Successfully processed ${allGyms.length} gyms out of ${gymDataArray.length} total`);

    return new Response(
      JSON.stringify({ gyms: allGyms }),
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
