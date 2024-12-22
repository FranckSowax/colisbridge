import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, firstName } = await req.json()

    // Vérifier les paramètres requis
    if (!email || !password || !firstName) {
      throw new Error('Email, password, and firstName are required')
    }

    // Envoyer l'email avec Brevo
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
    if (!BREVO_API_KEY) {
      throw new Error('Brevo API key not configured')
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'ColisBridge',
          email: 'no-reply@colisbridge.com'
        },
        to: [{
          email: email,
          name: firstName
        }],
        subject: 'Bienvenue sur ColisBridge',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Bienvenue sur ColisBridge, ${firstName} !</h2>
            <p>Votre compte a été créé avec succès. Voici vos identifiants de connexion :</p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0;"><strong>Email :</strong> ${email}</p>
              <p style="margin: 10px 0;"><strong>Mot de passe temporaire :</strong> ${password}</p>
            </div>
            <p style="color: #ef4444;">Pour des raisons de sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.</p>
            <div style="margin: 30px 0;">
              <a href="http://localhost:3000/login" 
                style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Se connecter
              </a>
            </div>
            <p style="color: #6b7280; font-size: 0.875rem;">Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet email.</p>
          </div>
        `
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`)
    }

    return new Response(
      JSON.stringify({ message: 'Welcome email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
