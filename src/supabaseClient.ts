import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// A function that allows the player to log in anonymously in the background.
export const initializeUser = async () => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error("An error occurred while checking the session:", sessionError.message);
    return null;
  }

  // If there is no existing session, start a new anonymous session.
  if (!session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("An error occurred while signing in anonymously:", error.message);
      return null;
    }
    return data.user;
  }

  return session.user;
};
