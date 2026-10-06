async function login(supabase) {
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: 'https://app.example.com/auth/callback' },
  })
}
