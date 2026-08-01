// Utilitaires photo, partagés entre outil-detail.html et groupe-detail.html

// Redimensionne une image côté navigateur avant l'envoi (économise data mobile + stockage)
async function redimensionnerImage(fichier, largeurMax = 1200, qualite = 0.8) {
  const bitmap = await createImageBitmap(fichier)
  const ratio = Math.min(1, largeurMax / bitmap.width)
  const largeur = Math.round(bitmap.width * ratio)
  const hauteur = Math.round(bitmap.height * ratio)

  const canvas = document.createElement('canvas')
  canvas.width = largeur
  canvas.height = hauteur
  canvas.getContext('2d').drawImage(bitmap, 0, 0, largeur, hauteur)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', qualite))
}

// Téléverse une photo dans le bucket "photos" et retourne son URL publique
async function televerserPhoto(fichier, dossier, id) {
  const blob = await redimensionnerImage(fichier)
  const chemin = `${dossier}/${id}-${Date.now()}.jpg`

  const { error } = await supabase.storage.from('photos').upload(chemin, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error

  const { data } = supabase.storage.from('photos').getPublicUrl(chemin)
  return data.publicUrl
}
