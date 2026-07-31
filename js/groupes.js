// Logique de la page groupes.html

function afficherToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

function escapeHtml(texte) {
  if (texte == null) return ''
  const div = document.createElement('div')
  div.textContent = texte
  return div.innerHTML
}

const overlay = document.getElementById('modal-overlay')
const form = document.getElementById('form-groupe')
const selectLocalisation = document.getElementById('localisation_id')

async function remplirSelectLocalisations() {
  const { data: localisations } = await supabase.from('localisations').select('id, nom').order('nom')
  selectLocalisation.innerHTML = '<option value="">— Aucune —</option>' +
    (localisations || []).map(l => `<option value="${l.id}">${escapeHtml(l.nom)}</option>`).join('')
}

document.getElementById('btn-ajouter').addEventListener('click', async () => {
  form.reset()
  await remplirSelectLocalisations()
  overlay.classList.remove('hidden')
})
document.getElementById('btn-fermer-modal').addEventListener('click', () => overlay.classList.add('hidden'))
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden') })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const valeurs = {
    nom: document.getElementById('nom').value.trim(),
    type: document.getElementById('type').value,
    localisation_id: selectLocalisation.value || null,
    notes: document.getElementById('notes').value.trim() || null,
  }

  const { error } = await supabase.from('groupes').insert(valeurs)

  if (error) {
    afficherToast('Erreur lors de l\'ajout')
    return
  }

  overlay.classList.add('hidden')
  afficherToast('Groupe ajouté')
  chargerGroupes()
})

async function chargerGroupes() {
  const conteneur = document.getElementById('liste-groupes')

  const [{ data: groupes, error }, { data: outils }] = await Promise.all([
    supabase.from('groupes').select('*, localisations(nom)').order('nom'),
    supabase.from('outils').select('id, groupe_id'),
  ])

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  if (groupes.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucun groupe. Ajoute-en un avec le bouton +</div>`
    return
  }

  conteneur.innerHTML = groupes.map(g => {
    const nbOutils = outils.filter(o => o.groupe_id === g.id).length
    const localisationNom = g.localisations ? g.localisations.nom : 'Sans localisation'
    return `
      <a href="groupe-detail.html?id=${g.id}" class="card list-item">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(g.nom)} <span class="badge badge-muted">${escapeHtml(g.type)}</span></div>
          <div class="list-item-sub">${localisationNom} · ${nbOutils} outil(s)</div>
        </div>
        <span class="chevron">›</span>
      </a>
    `
  }).join('')
}

chargerGroupes()
