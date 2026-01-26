import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { SignInWithApple, SignInWithAppleOptions, SignInWithAppleResponse } from '@capacitor-community/apple-sign-in';
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

  // Generate a random string for nonce (no special characters)
  const generateNonce = (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  };

  // Helper to hash nonce with SHA-256 for Apple Sign-In
  const sha256 = async (plain: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const signInWithAppleNative = async () => {
    try {
      setLoading(true);
      
      // Generate raw nonce (64 char hex string)
      // The Capacitor plugin may or may not hash internally - we'll try raw first
      const rawNonce = generateNonce();
      
      console.log('Apple Sign-In nonce (raw):', rawNonce.substring(0, 16) + '...');
      
      const options: SignInWithAppleOptions = {
        clientId: 'app.lovable.c139716001b54f8bac70ff059738767c',
        redirectURI: '', // Not needed for native
        scopes: 'email name',
        state: '', 
        nonce: rawNonce, // Try passing raw nonce - plugin may hash internally
      };

      const response: SignInWithAppleResponse = await SignInWithApple.authorize(options);
      
      if (!response.response?.identityToken) {
        throw new Error('No identity token received from Apple');
      }

      console.log('Apple identity token received, exchanging with Supabase...');
      console.log('Using raw nonce for Supabase:', rawNonce.substring(0, 10) + '...');

      // Use Supabase signInWithIdToken for native Apple Sign-In
      // Supabase gets the RAW nonce to verify against the hash in the token
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: response.response.identityToken,
        nonce: rawNonce, // Supabase gets the raw nonce
      });

      console.log('Supabase signInWithIdToken result:', { 
        hasData: !!data, 
        hasError: !!error,
        errorMessage: error?.message 
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
    } catch (error: any) {
      console.error('Apple Sign in error:', error);
      // User cancelled - don't show error toast
      if (error?.code === 1001 || error?.message?.includes('cancelled')) {
        return { error };
      }
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error?.message || "An unexpected error occurred"
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple') => {
    const platform = Capacitor.getPlatform();
    const isNativePlatform = Capacitor?.isNativePlatform?.() ?? false;
    const isCapacitorScheme =
      typeof window !== 'undefined' && window.location?.protocol === 'capacitor:';

    // In some builds, isNativePlatform can incorrectly return false.
    // Also, Capacitor apps commonly run on the capacitor:// scheme.
    const isNative =
      platform === 'ios' || platform === 'android' || isNativePlatform || isCapacitorScheme;

    const nativeRedirectUrl =
      'app.lovable.c139716001b54f8bac70ff059738767c://auth/callback';

    console.log('OAuth provider:', provider);
    console.log('Capacitor platform:', platform);
    console.log('Capacitor.isNativePlatform():', isNativePlatform);
    console.log('Window origin:', typeof window !== 'undefined' ? window.location.origin : 'n/a');
    console.log('Window protocol:', typeof window !== 'undefined' ? window.location.protocol : 'n/a');
    console.log('Computed isNative:', isNative);

    if (isCapacitorScheme && !isNativePlatform) {
      console.warn(
        'Auth debug: running on capacitor:// but isNativePlatform() returned false. Using native redirect anyway.'
      );
    }

    // Apple should use the native plugin on iOS. If we're not in a native container,
    // fail fast instead of sending the user to Supabase's web OAuth page.
    if (provider === 'apple') {
      // On iOS, always use the native plugin. Some builds may misreport platform/native state.
      if (platform === 'ios' || isCapacitorScheme) {
        console.log('Using native Apple Sign-In');
        return signInWithAppleNative();
      }

      toast({
        variant: 'destructive',
        title: 'Apple Sign-In unavailable',
        description: 'Apple Sign-In is only supported in the iOS app build.',
      });

      return { error: new Error('Apple Sign-In requires iOS native build') };
    }

    try {
      setLoading(true);

      const redirectUrl = isNative ? nativeRedirectUrl : `${window.location.origin}/`;

      console.log('OAuth sign-in redirectUrl', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          ...(isNative ? { skipBrowserRedirect: true } : {}),
        },
      });

      if (error) {
        console.error('Supabase signInWithOAuth error:', error.message, error);
        toast({
          variant: 'destructive',
          title: 'Sign in failed',
          description: error.message,
        });
        return { error };
      }

      // On native, open the provider auth URL in the system browser so the deep link callback
      // (appUrlOpen -> exchangeCodeForSession) can bring the user back into the app.
      if (isNative) {
        // NOTE: When using skipBrowserRedirect, Supabase returns an /authorize URL with
        // skip_http_redirect=true, which would otherwise download an "authorize.json" in Safari.
        // We must fetch that URL to get the real provider redirect URL.
        const authorizeUrl = (data as any)?.url as string | undefined;
        console.log('Authorize URL from Supabase:', authorizeUrl);
        
        if (!authorizeUrl) {
          const e = new Error('No OAuth URL returned from Supabase');
          console.error(e.message);
          toast({ variant: 'destructive', title: 'Sign in failed', description: e.message });
          return { error: e };
        }

        try {
          console.log('Fetching authorize URL...');
          const res = await fetch(authorizeUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });

          console.log('Authorize fetch response status:', res.status);

          if (!res.ok) {
            const errorText = await res.text();
            console.error('Authorize fetch failed:', res.status, errorText);
            const e = new Error(`OAuth authorize request failed (${res.status}): ${errorText}`);
            toast({ variant: 'destructive', title: 'Sign in failed', description: e.message });
            return { error: e };
          }

          const json = (await res.json()) as any;
          console.log('Authorize JSON response:', JSON.stringify(json));
          const providerUrl: string | undefined = json?.url;

          if (!providerUrl) {
            console.error('No provider URL in response:', json);
            const e = new Error('OAuth authorize response missing provider URL');
            toast({ variant: 'destructive', title: 'Sign in failed', description: e.message });
            return { error: e };
          }

          console.log('Opening browser with provider URL:', providerUrl);
          await Browser.open({ url: providerUrl });
        } catch (fetchError: any) {
          console.error('Fetch/Browser error:', fetchError?.message, fetchError);
          toast({
            variant: 'destructive',
            title: 'Sign in failed',
            description: fetchError?.message || 'Failed to open authentication page',
          });
          return { error: fetchError };
        }
      }

      return { error: null };
    } catch (error: any) {
      console.error('OAuth sign in error:', error?.message, error?.stack, JSON.stringify(error));
      toast({
        variant: 'destructive',
        title: 'Sign in failed',
        description: error?.message || 'An unexpected error occurred',
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