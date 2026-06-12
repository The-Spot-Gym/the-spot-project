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
    const check = async () => {
      // Check BOTH the query string and the hash for errors — Supabase returns
      // them in the hash on the final redirect, but they may also appear as
      // query params depending on the flow.
      const search = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorDesc =
        hashParams.get('error_description') || search.get('error_description');
      const errorCode = hashParams.get('error_code') || search.get('error_code');

      if (errorDesc || errorCode) {
        const msg = decodeURIComponent((errorDesc || errorCode || '').replace(/\+/g, ' '));
        setErrorMsg(
          errorCode === 'otp_expired'
            ? 'This confirmation link has expired. Please sign up again to get a new one.'
            : msg
        );
        setStatus('error');
        return;
      }

      // Give supabase-js a moment to process any tokens in the hash
      await new Promise((r) => setTimeout(r, 500));
      setStatus('success');
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
