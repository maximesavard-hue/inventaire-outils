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
const selectType = document.getElementById('type_id')
const selectLocalisation = document.getElementById('localisation_id')
const inputPhoto = document.getElementById('input-photo')
const texteLabelPhoto = document.getElementById('texte-label-photo')
let fichierPhotoChoisi = null

inputPhoto.addEventListener('change', (e) => {
  fichierPhotoChoisi = e.target.files[0] || null
  texteLabelPhoto.textContent = fichierPhotoChoisi ? `Photo choisie : ${fichierPhotoChoisi.name}` : 'Prendre / choisir une photo'
})

async function remplirSelects() {
  const [{ data: types }, { data: localisations }] = await Promise.all([
    supabase.from('types_groupe').select('id, nom').order('nom'),
    supabase.from('localisations').select('id, nom').order('nom'),
  ])
  selectType.innerHTML = (types || []).map(t => `<option value="${t.id}">${escapeHtml(t.nom)}</option>`).join('')
  const autre = (types || []).find(t => t.nom === 'Autre')
  if (autre) selectType.value = autre.id
  selectLocalisation.innerHTML = '<option value="">— Aucune —</option>' +
    (localisations || []).map(l => `<option value="${l.id}">${escapeHtml(l.nom)}</option>`).join('')
}

document.getElementById('btn-ajouter').addEventListener('click', async () => {
  form.reset()
  fichierPhotoChoisi = null
  texteLabelPhoto.textContent = 'Prendre / choisir une photo'
  await remplirSelects()
  overlay.classList.remove('hidden')
})
document.getElementById('btn-fermer-modal').addEventListener('click', () => overlay.classList.add('hidden'))
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden') })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const valeurs = {
    nom: document.getElementById('nom').value.trim(),
    type_id: selectType.value || null,
    localisation_id: selectLocalisation.value || null,
    notes: document.getElementById('notes').value.trim() || null,
  }

  const { data, error } = await supabase.from('groupes').insert(valeurs).select().single()

  if (error) {
    afficherToast('Erreur lors de l\'ajout')
    return
  }

  if (fichierPhotoChoisi) {
    try {
      const url = await televerserPhoto(fichierPhotoChoisi, 'groupes', data.id)
      await supabase.from('groupes').update({ photo_url: url }).eq('id', data.id)
    } catch (err) {
      afficherToast('Groupe ajouté, mais l\'envoi de la photo a échoué')
    }
  }

  overlay.classList.add('hidden')
  afficherToast('Groupe ajouté')
  chargerGroupes()
})

async function chargerGroupes() {
  const conteneur = document.getElementById('liste-groupes')

  const [{ data: groupes, error }, { data: outils }] = await Promise.all([
    supabase.from('groupes').select('*, localisations(nom), types_groupe(nom, couleur)').order('nom'),
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
    const photo = g.photo_url
      ? `<img src="${escapeHtml(g.photo_url)}" class="list-item-photo" alt="">`
      : ''
    const couleur = g.types_groupe ? g.types_groupe.couleur : '#9a9d97'
    const nomType = g.types_groupe ? g.types_groupe.nom : '—'

    return `
      <a href="groupe-detail.html?id=${g.id}" class="card list-item" style="border-left-color:${couleur};">
        ${photo}
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(g.nom)} <span class="badge" style="background:${couleur}22; color:${couleur};">${escapeHtml(nomType)}</span></div>
          <div class="list-item-sub">${localisationNom} · ${nbOutils} outil(s)</div>
        </div>
        <span class="chevron">›</span>
      </a>
    `
  }).join('')
}

chargerGroupes()
