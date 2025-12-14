import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string, displayName?: string) => {
    try {
      setLoading(true);
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username,
            display_name: displayName,
          }
        }
      });

      if (error) {
        toast({
          variant: "destructive", 
          title: "Sign up failed",
          description: error.message
        });
        return { error };
      }

      toast({
        title: "Check your email",
        description: "We've sent you a confirmation link to complete your registration."
      });

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        variant: "destructive",
        title: "Sign up failed", 
        description: "An unexpected error occurred"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed", 
          description: error.message
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Sign out failed",
          description: error.message
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive", 
        title: "Sign out failed",
        description: "An unexpected error occurred"
      });
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      // Use custom URL scheme for native iOS/Android, otherwise web URL
      const isNative = Capacitor?.isNativePlatform?.() ?? false;
      const redirectUrl = isNative 
        ? 'app.lovable.c139716001b54f8bac70ff059738767c://auth/callback'
        : `${window.location.origin}/`;
      
      console.log('OAuth sign-in redirectUrl', redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
        }
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Sign in failed",
          description: error.message
        });
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error('OAuth sign in error:', error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "An unexpected error occurred"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithOAuth,
  };
};