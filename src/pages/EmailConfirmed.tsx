import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function EmailConfirmed() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    // Supabase auto-processes the token in the URL hash via detectSessionInUrl.
    // We just wait briefly for the session to be established.
    const check = async () => {
      // Give supabase-js a moment to process the hash
      await new Promise((r) => setTimeout(r, 500));

      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
      const errorDesc = hashParams.get('error_description');

      if (errorDesc) {
        setErrorMsg(decodeURIComponent(errorDesc));
        setStatus('error');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setStatus('success');
      } else {
        // Even without a session in this browser, if the link was valid the email is now confirmed server-side.
        setStatus('success');
      }
    };
    check();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
              <CardTitle>Confirming your email...</CardTitle>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-secondary flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <CardTitle>Email Confirmed!</CardTitle>
              <CardDescription className="mt-2">
                Your account is now active. You can open The Spot app on your phone and sign in.
              </CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <CardTitle>Confirmation Failed</CardTitle>
              <CardDescription className="mt-2">{errorMsg || 'The link may be expired or already used.'}</CardDescription>
            </>
          )}
        </CardHeader>
        {status !== 'loading' && (
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="fitness" className="w-full">
              <Link to="/auth">Go to Sign In</Link>
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
