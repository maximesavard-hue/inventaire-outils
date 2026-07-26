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
const btnSupprimer = document.getElementById('btn-supprimer')
const selectLocalisation = document.getElementById('localisation_id')

async function remplirSelectLocalisations() {
  const { data: localisations } = await supabase.from('localisations').select('id, nom').order('nom')
  selectLocalisation.innerHTML = '<option value="">— Aucune —</option>' +
    (localisations || []).map(l => `<option value="${l.id}">${escapeHtml(l.nom)}</option>`).join('')
}

function ouvrirModal(groupe) {
  form.reset()
  if (groupe) {
    document.getElementById('modal-titre').textContent = 'Modifier le groupe'
    document.getElementById('groupe-id').value = groupe.id
    document.getElementById('nom').value = groupe.nom
    document.getElementById('type').value = groupe.type || 'Autre'
    selectLocalisation.value = groupe.localisation_id || ''
    document.getElementById('notes').value = groupe.notes || ''
    btnSupprimer.classList.remove('hidden')
  } else {
    document.getElementById('modal-titre').textContent = 'Nouveau groupe'
    document.getElementById('groupe-id').value = ''
    btnSupprimer.classList.add('hidden')
  }
  overlay.classList.remove('hidden')
}

function fermerModal() {
  overlay.classList.add('hidden')
}

document.getElementById('btn-ajouter').addEventListener('click', async () => {
  await remplirSelectLocalisations()
  ouvrirModal(null)
})
document.getElementById('btn-fermer-modal').addEventListener('click', fermerModal)
overlay.addEventListener('click', (e) => { if (e.target === overlay) fermerModal() })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = document.getElementById('groupe-id').value
  const valeurs = {
    nom: document.getElementById('nom').value.trim(),
    type: document.getElementById('type').value,
    localisation_id: selectLocalisation.value || null,
    notes: document.getElementById('notes').value.trim() || null,
  }

  const { error } = id
    ? await supabase.from('groupes').update(valeurs).eq('id', id)
    : await supabase.from('groupes').insert(valeurs)

  if (error) {
    afficherToast('Erreur lors de l\'enregistrement')
    return
  }

  fermerModal()
  afficherToast('Groupe enregistré')
  chargerGroupes()
})

btnSupprimer.addEventListener('click', async () => {
  const id = document.getElementById('groupe-id').value
  if (!confirm('Supprimer ce groupe ?')) return

  const { error } = await supabase.from('groupes').delete().eq('id', id)
  if (error) {
    afficherToast('Impossible de supprimer : des outils y sont encore associés')
    return
  }

  fermerModal()
  afficherToast('Groupe supprimé')
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
      <div class="card list-item card-clickable" data-id="${g.id}">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(g.nom)} <span class="badge badge-muted">${escapeHtml(g.type)}</span></div>
          <div class="list-item-sub">${localisationNom} · ${nbOutils} outil(s)</div>
        </div>
        <span class="chevron">›</span>
      </div>
    `
  }).join('')

  conteneur.querySelectorAll('.card-clickable').forEach(card => {
    card.addEventListener('click', async () => {
      const g = groupes.find(x => x.id === card.dataset.id)
      await remplirSelectLocalisations()
      ouvrirModal(g)
    })
  })
}

chargerGroupes()
