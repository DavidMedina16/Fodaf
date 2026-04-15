export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabase()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return navigateTo('/login')
  }

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!data || data.role !== 'admin') {
    return navigateTo('/dashboard')
  }
})
