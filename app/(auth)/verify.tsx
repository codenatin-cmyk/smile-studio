import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const Verify = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');

  useEffect(() => {
    const handleVerification = async () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(hash.replace('#', ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        setStatus('error');
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        console.error('❌ Failed to set session:', error.message);
        setStatus('error');
      } else {
        setStatus('success');
      }
    };

    handleVerification();
  }, []);

  return (
    <div style={styles.container}>
      {status === 'verifying' && <p>🔄 Verifying your email...</p>}
      {status === 'success' && (
        <>
          <p>✅ Email verified successfully!</p>
          <p>👉 Please go back to the login page and sign in to activate your account.</p>
        </>
      )}
      {status === 'error' && (
        <>
          <p>❌ Something went wrong verifying your email. Please try again.</p>
          <p>👉 Please go back to the login page and sign in again to activate your account.</p>
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column' as 'column',
    fontSize: '18px',
    fontFamily: 'sans-serif',
    textAlign: 'center' as 'center',
    padding: '0 20px',
    color: '#00505cff',
  },
};

export default Verify;
