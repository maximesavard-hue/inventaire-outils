// Logique de la page localisations.html

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
const form = document.getElementById('form-localisation')
const btnSupprimer = document.getElementById('btn-supprimer')

function ouvrirModal(localisation) {
  form.reset()
  if (localisation) {
    document.getElementById('modal-titre').textContent = 'Modifier la localisation'
    document.getElementById('localisation-id').value = localisation.id
    document.getElementById('nom').value = localisation.nom
    document.getElementById('notes').value = localisation.notes || ''
    btnSupprimer.classList.remove('hidden')
  } else {
    document.getElementById('modal-titre').textContent = 'Nouvelle localisation'
    document.getElementById('localisation-id').value = ''
    btnSupprimer.classList.add('hidden')
  }
  overlay.classList.remove('hidden')
}

function fermerModal() {
  overlay.classList.add('hidden')
}

document.getElementById('btn-ajouter').addEventListener('click', () => ouvrirModal(null))
document.getElementById('btn-fermer-modal').addEventListener('click', fermerModal)
overlay.addEventListener('click', (e) => { if (e.target === overlay) fermerModal() })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = document.getElementById('localisation-id').value
  const valeurs = {
    nom: document.getElementById('nom').value.trim(),
    notes: document.getElementById('notes').value.trim() || null,
  }

  const { error } = id
    ? await supabase.from('localisations').update(valeurs).eq('id', id)
    : await supabase.from('localisations').insert(valeurs)

  if (error) {
    afficherToast('Erreur lors de l\'enregistrement')
    return
  }

  fermerModal()
  afficherToast('Localisation enregistrée')
  chargerLocalisations()
})

btnSupprimer.addEventListener('click', async () => {
  const id = document.getElementById('localisation-id').value
  if (!confirm('Supprimer cette localisation ?')) return

  const { error } = await supabase.from('localisations').delete().eq('id', id)
  if (error) {
    afficherToast('Impossible de supprimer : des éléments y sont encore associés')
    return
  }

  fermerModal()
  afficherToast('Localisation supprimée')
  chargerLocalisations()
})

async function chargerLocalisations() {
  const conteneur = document.getElementById('liste-localisations')

  const [{ data: localisations, error }, { data: groupes }, { data: outils }] = await Promise.all([
    supabase.from('localisations').select('*').order('nom'),
    supabase.from('groupes').select('id, localisation_id'),
    supabase.from('outils').select('id, localisation_id, dans_groupe, groupe_id, groupes(localisation_id)'),
  ])

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  if (localisations.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucune localisation. Ajoute-en une avec le bouton +</div>`
    return
  }

  conteneur.innerHTML = localisations.map(loc => {
    const nbGroupes = groupes.filter(g => g.localisation_id === loc.id).length
    const nbOutils = outils.filter(o => {
      const effective = (o.dans_groupe && o.groupes) ? o.groupes.localisation_id : o.localisation_id
      return effective === loc.id
    }).length

    return `
      <div class="card list-item card-clickable" data-id="${loc.id}">
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(loc.nom)}</div>
          <div class="list-item-sub">${nbOutils} outil(s) · ${nbGroupes} groupe(s)</div>
        </div>
        <span class="chevron">›</span>
      </div>
    `
  }).join('')

  conteneur.querySelectorAll('.card-clickable').forEach(card => {
    card.addEventListener('click', () => {
      const loc = localisations.find(l => l.id === card.dataset.id)
      ouvrirModal(loc)
    })
  })
}

chargerLocalisations()
