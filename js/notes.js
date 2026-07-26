// Logique de la page notes.html

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

document.getElementById('form-ajout-rapide').addEventListener('submit', async (e) => {
  e.preventDefault()
  const champ = document.getElementById('nouvelle-note')
  const contenu = champ.value.trim()
  if (!contenu) return

  const { error } = await supabase.from('notes').insert({ contenu, type: 'Note' })
  if (error) {
    afficherToast('Erreur lors de l\'ajout')
    return
  }

  champ.value = ''
  chargerNotes()
})

async function basculerNote(id, completee) {
  const { error } = await supabase.from('notes').update({ completee }).eq('id', id)
  if (error) {
    afficherToast('Erreur lors de la mise à jour')
    return
  }
  chargerNotes()
}

async function supprimerNote(id) {
  if (!confirm('Supprimer cette note ?')) return
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) {
    afficherToast('Erreur lors de la suppression')
    return
  }
  chargerNotes()
}

function rendreNote(note) {
  return `
    <div class="card list-item">
      <div class="checkbox-row" style="flex:1">
        <input type="checkbox" data-id="${note.id}" class="check-note" ${note.completee ? 'checked' : ''}>
        <label class="${note.completee ? 'completed' : ''}">${escapeHtml(note.contenu)}</label>
      </div>
      <button class="btn-icon btn-supprimer-note" data-id="${note.id}" aria-label="Supprimer">🗑️</button>
    </div>
  `
}

async function chargerNotes() {
  const conteneurActives = document.getElementById('notes-actives')
  const conteneurCompletees = document.getElementById('notes-completees')

  const { data: notes, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    conteneurActives.innerHTML = `<div class="empty-state">Erreur de chargement</div>`
    conteneurCompletees.innerHTML = ''
    return
  }

  const actives = notes.filter(n => !n.completee)
  const completees = notes.filter(n => n.completee)

  conteneurActives.innerHTML = actives.length
    ? actives.map(rendreNote).join('')
    : `<div class="empty-state">Aucune note en attente</div>`

  conteneurCompletees.innerHTML = completees.length
    ? completees.map(rendreNote).join('')
    : `<div class="empty-state">Aucune note complétée</div>`

  document.querySelectorAll('.check-note').forEach(cb => {
    cb.addEventListener('change', (e) => basculerNote(e.target.dataset.id, e.target.checked))
  })
  document.querySelectorAll('.btn-supprimer-note').forEach(btn => {
    btn.addEventListener('click', (e) => supprimerNote(e.currentTarget.dataset.id))
  })
}

chargerNotes()
