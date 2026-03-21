import { useState, useEffect, type FormEvent } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (user?.email_verified) {
      navigate('/settings', { replace: true });
      return;
    }
    if (token) {
      setLoading(true);
      verifyEmail(undefined, token)
        .then(() => setSuccess(true))
        .catch((err: unknown) => {
          const e = err as { response?: { data?: { detail?: string } } };
          setError(e.response?.data?.detail || 'Invalid or expired verification link');
        })
        .finally(() => setLoading(false));
    }
  }, [token, user?.email_verified, navigate, verifyEmail]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/settings', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyEmail(code);
      setSuccess(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    try {
      await resendVerification();
      setResendMsg('Verification email sent! Check your inbox.');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setResendMsg(e.response?.data?.detail || 'Failed to resend. Try again later.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center mb-6 dark:text-white">Verify Your Email</h1>

        {success ? (
          <div className="text-center space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm">
              Email verified successfully! Redirecting...
            </div>
          </div>
        ) : token && loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400">Verifying...</p>
        ) : (
          <>
            {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">{error}</div>}
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the 6-digit code sent to <span className="font-medium">{user?.email}</span>
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-md text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  maxLength={6}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={handleResend} className="text-sm text-blue-600 hover:underline">
                Resend Code
              </button>
              {resendMsg && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{resendMsg}</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
