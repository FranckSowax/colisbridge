import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { EnvelopeIcon } from '@heroicons/react/24/outline/index.js';

export default function EmailVerification({ email, onVerificationSuccess }) {
  const [loading, setLoading] = useState(false);

  const handleSendVerificationEmail = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      toast.success('Email de vérification envoyé ! Veuillez vérifier votre boîte de réception.');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de vérification:', error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <EnvelopeIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Vérification d'email requise
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>
              Pour des raisons de sécurité, veuillez vérifier votre adresse email.
              Un email de vérification sera envoyé à {email}.
            </p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              <button
                type="button"
                onClick={handleSendVerificationEmail}
                disabled={loading}
                className="rounded-md bg-yellow-50 px-2 py-1.5 text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-600 focus:ring-offset-2 focus:ring-offset-yellow-50"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer l\'email de vérification'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
