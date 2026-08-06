// Logique du dashboard (index.html)

function afficherToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

// Calcule la localisation effective d'un outil selon les règles métier :
// 1. Si dans_groupe et rattaché à un groupe -> localisation du groupe
// 2. Sinon -> localisation propre de l'outil
function localisationEffective(outil) {
  if (outil.dans_groupe && outil.groupes) {
    return outil.groupes.localisation_id
  }
  return outil.localisation_id
}

async function chargerStats() {
  const [{ count: nbOutils }, { count: nbGroupes }, { count: nbLocalisations }] = await Promise.all([
    supabase.from('outils').select('*', { count: 'exact', head: true }),
    supabase.from('groupes').select('*', { count: 'exact', head: true }),
    supabase.from('localisations').select('*', { count: 'exact', head: true }),
  ])
  document.getElementById('stat-outils').textContent = nbOutils ?? 0
  document.getElementById('stat-groupes').textContent = nbGroupes ?? 0
  document.getElementById('stat-localisations').textContent = nbLocalisations ?? 0
}

async function chargerOutilsNonLocalises() {
  const conteneur = document.getElementById('outils-non-localises')
  const { data: outils, error } = await supabase
    .from('outils')
    .select('id, nom, quantite, dans_groupe, localisation_id, categories(nom), groupes(localisation_id)')

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  const nonLocalises = outils.filter(o => !localisationEffective(o))
  document.getElementById('count-non-localises').textContent = nonLocalises.length

  if (nonLocalises.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Tous les outils sont localisés 👍</div>`
    return
  }

  conteneur.innerHTML = nonLocalises.map(o => `
    <a href="outil-detail.html?id=${o.id}" class="card list-item">
      <div class="list-item-main">
        <div class="list-item-title">${escapeHtml(o.nom)}</div>
        <div class="list-item-sub">${escapeHtml(o.categories ? o.categories.nom : '—')} · Qté ${o.quantite}</div>
      </div>
      <span class="chevron">›</span>
    </a>
  `).join('')
}

async function chargerNotesActives() {
  const conteneur = document.getElementById('notes-actives')
  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .eq('completee', false)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  document.getElementById('count-notes').textContent = notes.length

  if (notes.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucune note en attente</div>`
    return
  }

  conteneur.innerHTML = notes.map(n => `
    <div class="card list-item">
      <div class="checkbox-row" style="flex:1">
        <input type="checkbox" data-id="${n.id}" class="check-note">
        <label>${escapeHtml(n.contenu)}</label>
      </div>
    </div>
  `).join('')

  document.querySelectorAll('.check-note').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const id = e.target.dataset.id
      const { error } = await supabase.from('notes').update({ completee: true }).eq('id', id)
      if (error) {
        afficherToast('Erreur lors de la mise à jour')
        return
      }
      chargerNotesActives()
    })
  })
}

function escapeHtml(texte) {
  if (texte == null) return ''
  const div = document.createElement('div')
  div.textContent = texte
  return div.innerHTML
}

chargerStats()
chargerOutilsNonLocalises()
chargerNotesActives()
