// Logique de la page scanner.html — lit un code QR et ouvre la fiche de l'outil correspondant

function afficherToast(message) {
  const toast = document.getElementById('toast')
  toast.textContent = message
  toast.classList.add('show')
  setTimeout(() => toast.classList.remove('show'), 2500)
}

function onScanSuccess(texteDecode) {
  scanner.clear()

  // Le QR contient l'URL complète vers outil-detail.html?id=... : on y va directement.
  // Si ce n'est pas une URL (code QR étranger), on tente quand même comme identifiant brut.
  try {
    const url = new URL(texteDecode)
    if (url.pathname.endsWith('outil-detail.html') && url.searchParams.get('id')) {
      window.location.href = texteDecode
      return
    }
  } catch (e) {
    // pas une URL valide, on continue avec le texte brut
  }

  afficherToast('Code QR non reconnu')
}

function onScanFailure() {
  // Appelé en continu tant qu'aucun code n'est détecté dans l'image : rien à faire.
}

const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: 250 }, false)
scanner.render(onScanSuccess, onScanFailure)
