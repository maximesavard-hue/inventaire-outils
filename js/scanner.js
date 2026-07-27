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

// La librairie html5-qrcode n'a pas d'option de langue : on traduit ses textes
// visibles après coup, au fur et à mesure qu'ils apparaissent dans le DOM.
const TRADUCTIONS = {
  'Requesting camera permissions...': 'Demande d\'accès à la caméra...',
  'Request Camera Permissions': 'Autoriser la caméra',
  'No camera found': 'Aucune caméra trouvée',
  'Scan an Image File': 'Scanner une image',
  'Select Camera': 'Choisir une caméra',
  'Start Scanning': 'Démarrer',
  'Stop Scanning': 'Arrêter',
  'Switch off flash': 'Éteindre le flash',
  'Switch on flash': 'Allumer le flash',
  'Scanning ongoing.': 'Scan en cours.',
  'Loading...': 'Chargement...',
  'Powered by ': 'Propulsé par ',
}

function traduireTexteNoeud(noeud) {
  const original = noeud.nodeValue.trim()
  if (TRADUCTIONS[original]) {
    noeud.nodeValue = noeud.nodeValue.replace(original, TRADUCTIONS[original])
  }
}

function traduireConteneur(element) {
  const marcheur = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let noeud
  while ((noeud = marcheur.nextNode())) {
    traduireTexteNoeud(noeud)
  }
}

const conteneurReader = document.getElementById('reader')
traduireConteneur(conteneurReader)
new MutationObserver(() => traduireConteneur(conteneurReader))
  .observe(conteneurReader, { childList: true, subtree: true, characterData: true })
