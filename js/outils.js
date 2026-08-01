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

const overlay = document.getElementById('modal-overlay')
const form = document.getElementById('form-outil')
const selectGroupe = document.getElementById('groupe_id')
const selectLocalisation = document.getElementById('localisation_id')
const champDansGroupe = document.getElementById('champ-dans-groupe')
const champLocalisation = document.getElementById('champ-localisation')
const checkboxDansGroupe = document.getElementById('dans_groupe')

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
    categorie: document.getElementById('categorie').value,
    quantite: parseInt(document.getElementById('quantite').value, 10) || 1,
    groupe_id: groupeChoisi,
    dans_groupe: groupeChoisi ? checkboxDansGroupe.checked : false,
    localisation_id: selectLocalisation.value || null,
  }

  const { error } = await supabase.from('outils').insert(valeurs)

  if (error) {
    afficherToast('Erreur lors de l\'ajout')
    return
  }

  overlay.classList.add('hidden')
  afficherToast('Outil ajouté')
  chargerOutils()
})

document.querySelectorAll('.filter-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'))
    chip.classList.add('active')
    categorieActive = chip.dataset.categorie
    afficherOutils()
  })
})

document.getElementById('recherche').addEventListener('input', (e) => {
  termeRecherche = e.target.value.trim().toLowerCase()
  afficherOutils()
})

function afficherOutils() {
  const conteneur = document.getElementById('liste-outils')

  let filtres = tousLesOutils
  if (categorieActive) {
    filtres = filtres.filter(o => o.categorie === categorieActive)
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

    return `
      <a href="outil-detail.html?id=${o.id}" class="card list-item" data-cat="${escapeHtml(o.categorie)}">
        ${photo}
        <div class="list-item-main">
          <div class="list-item-title">${escapeHtml(o.nom)} · Qté ${o.quantite}</div>
          <div style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;">
            <span class="badge" data-cat="${escapeHtml(o.categorie)}">${escapeHtml(o.categorie)}</span>
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
      id, nom, categorie, quantite, dans_groupe, groupe_id, localisation_id, photo_url,
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

chargerOutils()
