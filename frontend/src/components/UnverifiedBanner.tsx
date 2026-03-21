import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function UnverifiedBanner() {
  const { resendVerification } = useAuth();
  const [resendMsg, setResendMsg] = useState('');

  const handleResend = async () => {
    setResendMsg('');
    try {
      await resendVerification();
      setResendMsg('Sent!');
      setTimeout(() => setResendMsg(''), 3000);
    } catch {
      setResendMsg('Failed to send');
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-sm flex items-center justify-center gap-3">
      <span className="text-amber-800 dark:text-amber-200">
        Your email is not verified. You're limited to 1 project.
      </span>
      <Link
        to="/verify-email"
        className="font-medium text-amber-900 dark:text-amber-100 underline hover:no-underline"
      >
        Verify Now
      </Link>
      <button
        onClick={handleResend}
        className="text-amber-700 dark:text-amber-300 hover:underline"
      >
        {resendMsg || 'Resend Code'}
      </button>
    </div>
  );
}
