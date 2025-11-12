import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Note: supabaseAdmin uses the SERVICE_ROLE_KEY which you must only use in a backend context
// as it has admin privileges and overwrites RLS policies!

let supabaseAdmin: SupabaseClient;

// Create a mock client that properly implements method chaining
function createMockClient() {
  // Create a mock error that mimics the structure of a real Supabase error
  const mockError = {
    message: 'Supabase not configured. Please check your environment variables.',
    details: 'Missing or invalid Supabase credentials in .env.local file.',
    hint: 'Add your Supabase URL and keys to .env.local',
    code: 'CONFIGURATION_ERROR'
  };

  const mockQuery = {
    select: () => mockQuery,
    insert: () => mockQuery,
    update: () => mockQuery,
    eq: () => mockQuery,
    single: () => mockQuery,
    order: () => mockQuery,
    data: null,
    error: mockError
  };
  
  return {
    from: () => mockQuery
  } as any;
}

// Only initialize the client if environment variables are available
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  // Validate that the Supabase URL is a valid HTTP/HTTPS URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    console.error('Invalid Supabase URL: Must be a valid HTTP or HTTPS URL');
    // Create a mock client for development
    supabaseAdmin = createMockClient();
  } else {
    supabaseAdmin = createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
} else {
  // Create a mock client for development
  console.warn('Supabase environment variables not found. Using mock client.');
  supabaseAdmin = createMockClient();
}

export { supabaseAdmin }