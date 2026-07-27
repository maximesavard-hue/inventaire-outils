// Configuration Supabase
const SUPABASE_URL = 'https://twzttyglnloshujwnlkx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_U_0EkEYJJGuz-IrhZSc9Vw_14UzaY3f'

// Client Supabase (chargé via CDN dans chaque page HTML)
// Remplace l'objet librairie global par le client initialisé (évite une redéclaration
// de `const supabase` qui entrerait en conflit avec le global déjà défini par le CDN)
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
