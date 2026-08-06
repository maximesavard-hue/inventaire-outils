// Logique de la page parametres.html — gestion des catégories d'outils et types de groupe

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

// Palette de couleurs prédéfinies, choisies pour bien s'agencer avec le thème sombre.
// (Le doré n'y figure pas volontairement : c'est déjà la couleur des boutons/actions de l'app.)
const PALETTE_COULEURS = [
  { nom: 'Bleu', hex: '#4a90d9' },
  { nom: 'Violet', hex: '#b47fd4' },
  { nom: 'Orange', hex: '#e0954a' },
  { nom: 'Vert', hex: '#5fbf6b' },
  { nom: 'Rouge', hex: '#d9583f' },
  { nom: 'Rose', hex: '#d97fb0' },
  { nom: 'Turquoise', hex: '#4ac9c0' },
  { nom: 'Gris', hex: '#9a9d97' },
]

function remplirSelectCouleurs(select) {
  select.innerHTML = PALETTE_COULEURS.map(c => `<option value="${c.hex}">${c.nom}</option>`).join('')
}

remplirSelectCouleurs(document.getElementById('categorie-couleur'))
remplirSelectCouleurs(document.getElementById('type-couleur'))

// ---------- Catégories d'outils ----------

const overlayCategorie = document.getElementById('modal-categorie')
const formCategorie = document.getElementById('form-categorie')
const btnSupprimerCategorie = document.getElementById('btn-supprimer-categorie')

function ouvrirModalCategorie(categorie) {
  formCategorie.reset()
  if (categorie) {
    document.getElementById('titre-modal-categorie').textContent = 'Modifier la catégorie'
    document.getElementById('categorie-id').value = categorie.id
    document.getElementById('categorie-nom').value = categorie.nom
    document.getElementById('categorie-couleur').value = categorie.couleur
    btnSupprimerCategorie.classList.remove('hidden')
  } else {
    document.getElementById('titre-modal-categorie').textContent = 'Nouvelle catégorie'
    document.getElementById('categorie-id').value = ''
    btnSupprimerCategorie.classList.add('hidden')
  }
  overlayCategorie.classList.remove('hidden')
}

document.getElementById('btn-ajouter-categorie').addEventListener('click', () => ouvrirModalCategorie(null))
document.getElementById('btn-fermer-modal-categorie').addEventListener('click', () => overlayCategorie.classList.add('hidden'))
overlayCategorie.addEventListener('click', (e) => { if (e.target === overlayCategorie) overlayCategorie.classList.add('hidden') })

formCategorie.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = document.getElementById('categorie-id').value
  const valeurs = {
    nom: document.getElementById('categorie-nom').value.trim(),
    couleur: document.getElementById('categorie-couleur').value,
  }

  const { error } = id
    ? await supabase.from('categories').update(valeurs).eq('id', id)
    : await supabase.from('categories').insert(valeurs)

  if (error) {
    afficherToast(error.code === '23505' ? 'Ce nom de catégorie existe déjà' : 'Erreur lors de l\'enregistrement')
    return
  }

  overlayCategorie.classList.add('hidden')
  afficherToast('Catégorie enregistrée')
  chargerCategories()
})

btnSupprimerCategorie.addEventListener('click', async () => {
  const id = document.getElementById('categorie-id').value
  if (!confirm('Supprimer cette catégorie ?')) return

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) {
    afficherToast('Impossible de supprimer : des outils l\'utilisent encore')
    return
  }

  overlayCategorie.classList.add('hidden')
  afficherToast('Catégorie supprimée')
  chargerCategories()
})

async function chargerCategories() {
  const conteneur = document.getElementById('liste-categories')
  const { data: categories, error } = await supabase.from('categories').select('*').order('nom')

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  if (categories.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucune catégorie</div>`
    return
  }

  conteneur.innerHTML = categories.map(c => `
    <div class="card list-item card-clickable" data-id="${c.id}">
      <span style="width:18px; height:18px; border-radius:50%; background:${c.couleur}; flex-shrink:0;"></span>
      <div class="list-item-main">
        <div class="list-item-title">${escapeHtml(c.nom)}</div>
      </div>
      <span class="chevron">›</span>
    </div>
  `).join('')

  conteneur.querySelectorAll('.card-clickable').forEach(card => {
    card.addEventListener('click', () => {
      const c = categories.find(x => x.id === card.dataset.id)
      ouvrirModalCategorie(c)
    })
  })
}

// ---------- Types de groupe ----------

const overlayType = document.getElementById('modal-type')
const formType = document.getElementById('form-type')
const btnSupprimerType = document.getElementById('btn-supprimer-type')

function ouvrirModalType(type) {
  formType.reset()
  if (type) {
    document.getElementById('titre-modal-type').textContent = 'Modifier le type'
    document.getElementById('type-id').value = type.id
    document.getElementById('type-nom').value = type.nom
    document.getElementById('type-couleur').value = type.couleur
    btnSupprimerType.classList.remove('hidden')
  } else {
    document.getElementById('titre-modal-type').textContent = 'Nouveau type'
    document.getElementById('type-id').value = ''
    btnSupprimerType.classList.add('hidden')
  }
  overlayType.classList.remove('hidden')
}

document.getElementById('btn-ajouter-type').addEventListener('click', () => ouvrirModalType(null))
document.getElementById('btn-fermer-modal-type').addEventListener('click', () => overlayType.classList.add('hidden'))
overlayType.addEventListener('click', (e) => { if (e.target === overlayType) overlayType.classList.add('hidden') })

formType.addEventListener('submit', async (e) => {
  e.preventDefault()
  const id = document.getElementById('type-id').value
  const valeurs = {
    nom: document.getElementById('type-nom').value.trim(),
    couleur: document.getElementById('type-couleur').value,
  }

  const { error } = id
    ? await supabase.from('types_groupe').update(valeurs).eq('id', id)
    : await supabase.from('types_groupe').insert(valeurs)

  if (error) {
    afficherToast(error.code === '23505' ? 'Ce nom de type existe déjà' : 'Erreur lors de l\'enregistrement')
    return
  }

  overlayType.classList.add('hidden')
  afficherToast('Type enregistré')
  chargerTypes()
})

btnSupprimerType.addEventListener('click', async () => {
  const id = document.getElementById('type-id').value
  if (!confirm('Supprimer ce type ?')) return

  const { error } = await supabase.from('types_groupe').delete().eq('id', id)
  if (error) {
    afficherToast('Impossible de supprimer : des groupes l\'utilisent encore')
    return
  }

  overlayType.classList.add('hidden')
  afficherToast('Type supprimé')
  chargerTypes()
})

async function chargerTypes() {
  const conteneur = document.getElementById('liste-types')
  const { data: types, error } = await supabase.from('types_groupe').select('*').order('nom')

  if (error) {
    conteneur.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    return
  }

  if (types.length === 0) {
    conteneur.innerHTML = `<div class="empty-state">Aucun type</div>`
    return
  }

  conteneur.innerHTML = types.map(t => `
    <div class="card list-item card-clickable" data-id="${t.id}">
      <span style="width:18px; height:18px; border-radius:50%; background:${t.couleur}; flex-shrink:0;"></span>
      <div class="list-item-main">
        <div class="list-item-title">${escapeHtml(t.nom)}</div>
      </div>
      <span class="chevron">›</span>
    </div>
  `).join('')

  conteneur.querySelectorAll('.card-clickable').forEach(card => {
    card.addEventListener('click', () => {
      const t = types.find(x => x.id === card.dataset.id)
      ouvrirModalType(t)
    })
  })
}

chargerCategories()
chargerTypes()
