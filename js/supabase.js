// Configuration Supabase
const SUPABASE_URL = 'https://twzttyglnloshujwnlkx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_U_0EkEYJJGuz-IrhZSc9Vw_14UzaY3f'

// Client Supabase (chargé via CDN dans chaque page HTML)
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
