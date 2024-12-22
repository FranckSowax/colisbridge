import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ayxltzvmpqxtyfvfotxd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5eGx0enZtcHF4dHlmdmZvdHhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0Nzk5NjcsImV4cCI6MjA1MDA1NTk2N30.--5nlZFj4yKdBg_X0ked23vvFMsvWdKQ2dNbpJlnq0s'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testWelcomeEmail() {
  try {
    const { data, error } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: 'sftb2k20@gmail.com',
        firstName: 'Sowax',
        password: 'Welcome2024!'
      }
    })

    if (error) {
      console.error('Error:', error)
      return
    }
    console.log('Success:', data)
    console.log('Un email a été envoyé à sftb2k20@gmail.com avec le mot de passe temporaire: Welcome2024!')
  } catch (error) {
    console.error('Error:', error)
  }
}

testWelcomeEmail()
