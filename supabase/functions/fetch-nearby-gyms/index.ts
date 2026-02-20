import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_SEARCHES_PER_DAY = 2;

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

    const userId = claimsData.claims.sub;

    const { latitude, longitude, radius: rawRadius, searchQuery } = await req.json();

    // Input validation
    if (latitude !== undefined && (typeof latitude !== 'number' || latitude < -90 || latitude > 90)) {
      return new Response(
        JSON.stringify({ error: 'Invalid latitude (must be between -90 and 90)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (longitude !== undefined && (typeof longitude !== 'number' || longitude < -180 || longitude > 180)) {
      return new Response(
        JSON.stringify({ error: 'Invalid longitude (must be between -180 and 180)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const radius = typeof rawRadius === 'number' ? Math.min(Math.max(rawRadius, 0), 50000) : 5000;
    if (searchQuery !== undefined && typeof searchQuery !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid search query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    if (typeof searchQuery === 'string' && searchQuery.length > 200) {
      return new Response(
        JSON.stringify({ error: 'Search query too long (max 200 characters)' }),
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

    // Rate limit check: max 2 searches per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count, error: countError } = await supabase
      .from('gym_search_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('searched_at', todayStart.toISOString());

    if (countError) {
      console.error('Error checking rate limit:', countError);
    }

    if ((count ?? 0) >= MAX_SEARCHES_PER_DAY) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily search limit reached',
          message: `You can only search for gyms ${MAX_SEARCHES_PER_DAY} times per day. Try again tomorrow!`,
          limit_reached: true
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log this search
    await supabase
      .from('gym_search_log')
      .insert({ user_id: userId });

    const allPlaces = new Map();
    
    // If searchQuery is provided, do a text-based search (no location required)
    if (searchQuery && searchQuery.trim().length > 0) {
      console.log('Searching for gym:', searchQuery);
      
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery + ' gym')}&type=gym&key=${googleApiKey}`;
      
      try {
        const response = await fetch(textSearchUrl);
        const data = await response.json();

        if (data.status === 'OK' && data.results) {
          for (const place of data.results) {
            if (!allPlaces.has(place.place_id)) {
              allPlaces.set(place.place_id, place);
            }
          }
          console.log(`Found ${data.results.length} results for search query`);
        } else if (data.status !== 'ZERO_RESULTS') {
          console.error('Google Places API error for search:', data.status, data.error_message);
        }
      } catch (error) {
        console.error('Error searching:', error);
      }
    } else {
      // Location-based nearby search
      if (!latitude || !longitude) {
        return new Response(
          JSON.stringify({ error: 'Latitude and longitude are required for nearby search' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const searchQueries = [
        'gym',
        'fitness center',
        '24 hour fitness',
        'YMCA',
        'health club',
        'crossfit'
      ];

      console.log('Fetching nearby gyms from Google Places API...');

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
      
      for (const placeList of results) {
        for (const place of placeList) {
          if (!allPlaces.has(place.place_id)) {
            allPlaces.set(place.place_id, place);
          }
        }
      }
    }

    console.log(`Found ${allPlaces.size} unique gyms`);

    const toRadians = (deg: number) => (deg * Math.PI) / 180;
    const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = toRadians(lat2 - lat1);
      const dLon = toRadians(lon2 - lon1);
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const gymsWithDistance = Array.from(allPlaces.values())
      .filter(place => place.place_id && place.name && place.geometry?.location?.lat && place.geometry?.location?.lng)
      .map(place => {
        let distanceKm = 0;
        if (latitude && longitude) {
          distanceKm = calculateDistanceKm(latitude, longitude, place.geometry.location.lat, place.geometry.location.lng);
        }
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

    const MAX_GYMS = 30;
    const limitedGymsWithDistance = gymsWithDistance
      .sort((a, b) => latitude && longitude ? a._distanceKm - b._distanceKm : (b.rating || 0) - (a.rating || 0))
      .slice(0, MAX_GYMS);

    const gymDataArray = limitedGymsWithDistance.map(({ _distanceKm, ...gym }) => gym);

    console.log(`Validated ${gymDataArray.length} gyms for database insert`);

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
          continue;
        }
        if (batchGyms) {
          allGyms.push(...batchGyms);
        }
      } catch (error) {
        console.error(`Exception in batch ${i / BATCH_SIZE + 1}:`, error);
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
