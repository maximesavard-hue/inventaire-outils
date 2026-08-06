// Logique de la page outils.html

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

// Calcule la localisation effective d'un outil selon les règles métier :
// 1. Si dans_groupe et rattaché à un groupe -> localisation du groupe
// 2. Sinon -> localisation propre de l'outil
function nomLocalisationEffective(outil) {
  if (outil.dans_groupe && outil.groupes) {
    return outil.groupes.localisations ? outil.groupes.localisations.nom : null
  }
  return outil.localisations ? outil.localisations.nom : null
}

let categorieActive = ''
let termeRecherche = ''
let tousLesOutils = []
let toutesLesCategories = []

const overlay = document.getElementById('modal-overlay')
const form = document.getElementById('form-outil')
const selectCategorie = document.getElementById('categorie_id')
const selectGroupe = document.getElementById('groupe_id')
const selectLocalisation = document.getElementById('localisation_id')
const champDansGroupe = document.getElementById('champ-dans-groupe')
const champLocalisation = document.getElementById('champ-localisation')
const checkboxDansGroupe = document.getElementById('dans_groupe')
const inputPhoto = document.getElementById('input-photo')
const texteLabelPhoto = document.getElementById('texte-label-photo')
let fichierPhotoChoisi = null

inputPhoto.addEventListener('change', (e) => {
  fichierPhotoChoisi = e.target.files[0] || null
  texteLabelPhoto.textContent = fichierPhotoChoisi ? `Photo choisie : ${fichierPhotoChoisi.name}` : 'Prendre / choisir une photo'
})

async function chargerCategoriesEtFiltres() {
  const { data: categories } = await supabase.from('categories').select('*').order('nom')
  toutesLesCategories = categories || []

  const conteneurFiltres = document.getElementById('filtres-categorie')
  toutesLesCategories.forEach(c => {
    const chip = document.createElement('button')
    chip.className = 'filter-chip'
    chip.dataset.categorie = c.id
    chip.textContent = c.nom
    chip.addEventListener('click', () => activerFiltre(chip))
    conteneurFiltres.appendChild(chip)
  })

  document.querySelector('.filter-chip[data-categorie=""]').addEventListener('click', function () {
    activerFiltre(this)
  })
}

function activerFiltre(chip) {
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
  chip.classList.add('active')
  categorieActive = chip.dataset.categorie
  afficherOutils()
}

function remplirSelectCategorie() {
  selectCategorie.innerHTML = toutesLesCategories.map(c => `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('')
  const autre = toutesLesCategories.find(c => c.nom === 'Autre')
  if (autre) selectCategorie.value = autre.id
}

async function remplirSelects() {
  const [{ data: groupes }, { data: localisations }] = await Promise.all([
    supabase.from('groupes').select('id, nom').order('nom'),
    supabase.from('localisations').select('id, nom').order('nom'),
  ])
  selectGroupe.innerHTML = '<option value="">— Aucun —</option>' +
    (groupes || []).map(g => `<option value="${g.id}">${escapeHtml(g.nom)}</option>`).join('')
  selectLocalisation.innerHTML = '<option value="">— Aucune —</option>' +
    (localisations || []).map(l => `<option value="${l.id}">${escapeHtml(l.nom)}</option>`).join('')
}

function mettreAJourVisibiliteChamps() {
  const groupeChoisi = selectGroupe.value !== ''
  champDansGroupe.classList.toggle('hidden', !groupeChoisi)
  const localisationNecessaire = !groupeChoisi || !checkboxDansGroupe.checked
  champLocalisation.classList.toggle('hidden', !localisationNecessaire)
}

selectGroupe.addEventListener('change', mettreAJourVisibiliteChamps)
checkboxDansGroupe.addEventListener('change', mettreAJourVisibiliteChamps)

document.getElementById('btn-ajouter').addEventListener('click', async () => {
  form.reset()
  fichierPhotoChoisi = null
  texteLabelPhoto.textContent = 'Prendre / choisir une photo'
  remplirSelectCategorie()
  await remplirSelects()
  mettreAJourVisibiliteChamps()
  overlay.classList.remove('hidden')
})

document.getElementById('btn-fermer-modal').addEventListener('click', () => overlay.classList.add('hidden'))
overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden') })

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  const groupeChoisi = selectGroupe.value || null
  const valeurs = {
    nom: document.getElementById('nom').value.trim(),
    categorie_id: selectCategorie.value || null,
    quantite: parseInt(document.getElementById('quantite').value, 10) || 1,
    groupe_id: groupeChoisi,
    dans_groupe: groupeChoisi ? checkboxDansGroupe.checked : false,
    localisation_id: selectLocalisation.value || null,
  }

  const { data, error } = await supabase.from('outils').insert(valeurs).select().single()

  if (error) {
    afficherToast('Erreur lors de l\'ajout')
    return
  }

  if (fichierPhotoChoisi) {
    try {
      const url = await televerserPhoto(fichierPhotoChoisi, 'outils', data.id)
      await supabase.from('outils').update({ photo_url: url }).eq('id', data.id)
    } catch (err) {
      afficherToast('Outil ajouté, mais l\'envoi de la photo a échoué')
    }
  }

  overlay.classList.add('hidden')
  afficherToast('Outil ajouté')
  chargerOutils()
})

document.getElementById('recherche').addEventListener('input', (e) => {
  termeRecherche = e.target.value.trim().toLowerCase()
  afficherOutils()
})

function afficherOutils() {
  const conteneur = document.getElementById('liste-outils')

  let filtres = tousLesOutils
  if (categorieActive) {
    filtres = filtres.filter(o => o.categorie_id === categorieActive)
  }
  if (termeRecherche) {
    filtres = filtres.filter(o => o.nom.toLowerCase().includes(termeRecherche))
  }

  if (filtres.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucun outil trouvé</div>`
    return
  }

  conteneur.innerHTML = filtres.map(o => {
    const nomLoc = nomLocalisationEffective(o)
    const badgeLoc = nomLoc
      ? `<span class="badge badge-muted">${escapeHtml(nomLoc)}</span>`
      : `<span class="badge badge-warning">Non localisé</span>`
    const badgeGroupe = o.groupes ? `<span class="badge badge-muted">${escapeHtml(o.groupes.nom)}</span>` : ''

    const photo = o.photo_url
      ? `<img src="${escapeHtml(o.photo_url)}" class="list-item-photo" alt="">`
      : ''

    const couleur = o.categories ? o.categories.couleur : '#9a9d97'
    const nomCategorie = o.categories ? o.categories.nom : '—'

    return `
      <a href="outil-detail.html?id=${o.id}" class="card list-item" style="border-left-color:${couleur};">
        ${photo}
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(o.nom)} · Qté ${o.quantite}</div>
          <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
            <span class="badge" style="background:${couleur}22; color:${couleur};">${escapeHtml(nomCategorie)}</span>
            ${badgeLoc}${badgeGroupe}
          </div>
        </div>
        <span class="chevron">›</span>
      </a>
    `
  }).join('')
}

async function chargerOutils() {
  const conteneur = document.getElementById('liste-outils')
  const { data, error } = await supabase
    .from('outils')
    .select(`
      id, nom, categorie_id, quantite, dans_groupe, groupe_id, localisation_id, photo_url,
      categories(nom, couleur),
      localisations(nom),
      groupes(nom, localisation_id, localisations(nom))
    `)
    .order('nom')

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  tousLesOutils = data
  afficherOutils()
}

chargerCategoriesEtFiltres().then(chargerOutils)
