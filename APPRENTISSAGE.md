# Apprentissage — Comprendre l'app Inventaire Outils

Ce document explique **ce qu'on a construit et pourquoi**, pour que tu puisses comprendre le projet en profondeur — pas juste l'utiliser. Il est écrit pour quelqu'un qui ne connaît pas Supabase ni le développement web. Garde-le à côté du code : chaque section pointe vers les vrais fichiers du projet.

---

## 1. La grande idée

Une application web classique a souvent deux morceaux :

1. **Le frontend** — ce que tu vois et cliques dans le navigateur (les pages HTML, le CSS, le JavaScript)
2. **Le backend** — là où les données sont stockées et protégées (une base de données, un serveur)

Normalement, construire le backend demande de louer un serveur, l'entretenir, gérer la sécurité, etc. — beaucoup de travail pour une app perso. On a évité tout ça avec deux services **gratuits** :

- **GitHub Pages** héberge le frontend (les fichiers HTML/CSS/JS) — gratuitement, pour toujours, tant que le repo existe.
- **Supabase** héberge le backend (la base de données) — gratuitement, avec une API déjà prête à l'emploi.

Le frontend (dans ton navigateur, sur ton téléphone) parle directement à Supabase par internet à chaque fois qu'il faut lire ou écrire une donnée. Il n'y a pas de serveur intermédiaire qu'on a dû écrire nous-mêmes.

```
Ton téléphone (navigateur)  ──── internet ────>  Supabase (base de données)
        │
        └── fichiers HTML/CSS/JS servis par GitHub Pages
```

---

## 2. Supabase — la base de données

### C'est quoi, concrètement ?

Supabase est un service qui te donne une vraie base de données **Postgres** (un des systèmes de base de données les plus utilisés au monde, gratuit et open-source) déjà installée, déjà en ligne, avec une interface web pour la gérer (le "Dashboard" que tu as visité pour coller le script SQL).

La partie magique : dès que tu crées une table dans Supabase, il génère **automatiquement une API** pour cette table — un ensemble d'URLs qu'on peut appeler depuis le navigateur pour lire/écrire des données, sans écrire une seule ligne de code serveur. Cette techno s'appelle **PostgREST**, et c'est ce qui rend Supabase si rapide à utiliser pour un petit projet.

### Les 4 tables et leurs liens

Le fichier [`supabase-tables.sql`](supabase-tables.sql) contient la définition de toute la base. Il y a 4 tables :

```
localisations               groupes                    outils                    notes
─────────────                ───────                    ──────                    ─────
id                            id                          id                        id
nom                            nom                         nom                       contenu
notes                          type                        categorie                 type
                                localisation_id ──┐         quantite                  completee
                                notes              │        groupe_id ────────┐
                                                    │        dans_groupe        │
                                                    │        localisation_id ───┼──┐
                                                    │                           │  │
                                                    └──────> localisations <────┘  │
                                                                    ^──────────────┘
```

- Un **outil** peut appartenir à un **groupe** (ex : une perceuse dans un packout)
- Un **groupe** a une **localisation** (le packout est au chalet)
- Un **outil** peut aussi avoir sa propre **localisation** directe, s'il n'est pas dans un groupe, ou s'il en est sorti temporairement (`dans_groupe = false`)

Cette relation "A pointe vers B" s'appelle une **clé étrangère** (foreign key) en base de données — c'est le `localisation_id uuid REFERENCES localisations(id)` que tu vois dans le fichier SQL. Ça garantit qu'on ne peut pas mettre un outil "au Chalet" si "Chalet" n'existe pas vraiment dans la table `localisations`.

### La clé "publishable" (anon key)

Dans [`js/supabase.js`](js/supabase.js) :

```js
const SUPABASE_URL = 'https://twzttyglnloshujwnlkx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_...'
```

Cette clé est **volontairement publique** — n'importe qui peut la voir en inspectant le code de ton site (c'est comme ça pour tous les sites qui utilisent Supabase). Ce n'est pas un mot de passe : elle identifie juste "je suis l'app inventaire-outils", pas "je suis Maxime". Ce qui protège réellement tes données, ce sont les règles côté base de données (section suivante).

### RLS (Row Level Security) — et pourquoi on l'a désactivé

Postgres a un système intégré qui permet de dire "seul tel utilisateur peut voir/modifier telle ligne". C'est **RLS**. Dans une app avec plusieurs utilisateurs (ex : une app où chaque client voit seulement ses propres données), c'est essentiel.

Ici, l'app est **personnelle, un seul utilisateur (toi)** — donc on a explicitement désactivé RLS sur les 4 tables (à la fin de `supabase-tables.sql` : `ALTER TABLE ... DISABLE ROW LEVEL SECURITY`). Ça veut dire : quiconque a la clé publique peut lire/écrire dans tes tables. Comme la clé est publique de toute façon (voir ci-dessus) et que la seule vraie protection serait un vrai système de connexion (login), ce compromis est acceptable pour un outil perso, mais **ce ne serait pas correct pour une app avec des données sensibles ou plusieurs utilisateurs** — ce sera à revoir si un jour tu ajoutes ton père comme utilisateur (mentionné en V2 dans le `CLAUDE.md`).

### Comment le code parle à Supabase

Exemple tiré de [`js/localisations.js`](js/localisations.js) :

```js
const { data: localisations, error } = await supabase
  .from('localisations')
  .select('*')
  .order('nom')
```

Ça se lit presque comme une phrase : *"dans la table `localisations`, sélectionne toutes les colonnes (`*`), triées par `nom`"*. Derrière, la librairie `supabase-js` transforme ça en vraie requête web (HTTP) vers ton projet Supabase, et te redonne soit `data` (les résultats), soit `error` (si ça a échoué).

---

## 3. GitHub Pages — l'hébergement

**Git** est un système qui garde l'historique de chaque changement fait à ton code (qui a changé quoi, quand). **GitHub** est un site qui héberge ces "dépôts" (repos) en ligne — ton code est ici : https://github.com/maximesavard-hue/inventaire-outils

**GitHub Pages** est une fonctionnalité gratuite de GitHub : elle prend les fichiers de ton repo et les sert directement comme un site web, à l'adresse https://maximesavard-hue.github.io/inventaire-outils/

Le flux, à chaque changement :
1. On modifie un fichier (ex : `css/style.css`)
2. `git commit` — on décrit le changement et on l'enregistre dans l'historique local
3. `git push` — on envoie ce changement vers GitHub
4. GitHub Pages détecte le changement et **reconstruit** le site automatiquement (30 secondes à 2 minutes)
5. Le site en ligne est à jour

C'est pour ça qu'après chaque modification, il fallait attendre un peu avant de voir le changement apparaître en direct.

---

## 4. La structure des fichiers

| Fichier | Rôle |
|---|---|
| `index.html` | Le tableau de bord (page d'accueil) |
| `outils.html` / `js/outils.js` | Liste, recherche et ajout rapide des outils |
| `outil-detail.html` | Fiche complète d'un outil (édition, suppression, code QR) |
| `groupes.html` / `js/groupes.js` | Gestion des groupes (packouts, bacs...) |
| `localisations.html` / `js/localisations.js` | Gestion des lieux |
| `notes.html` / `js/notes.js` | Bloc-notes / todo |
| `js/supabase.js` | Connexion à la base de données (chargé par toutes les pages) |
| `js/dashboard.js` | Logique spécifique au tableau de bord |
| `css/style.css` | Tous les styles visuels du site |
| `supabase-tables.sql` | Le plan de la base de données (à coller une seule fois dans Supabase) |
| `CLAUDE.md` | Les instructions du projet pour moi (Claude) |

Remarque : il n'y a **pas de framework** (pas de React, Vue, etc.) et **pas d'étape de build** — chaque fichier `.html` fonctionne tel quel, ouvert directement par le navigateur. C'est un choix volontaire (voir `CLAUDE.md`, section "Philosophie de développement") : ça reste simple à comprendre et à modifier, même sans expérience en développement.

---

## 5. Anatomie d'une page, de bout en bout

Prenons `localisations.html` comme exemple concret.

**Étape 1 — Le HTML charge 3 scripts, dans l'ordre :**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase.js"></script>
<script src="js/localisations.js"></script>
```
1. La librairie Supabase elle-même (téléchargée depuis un CDN — un serveur qui distribue des librairies JS publiques)
2. Notre configuration (`js/supabase.js`) qui crée la connexion
3. La logique propre à cette page

**Étape 2 — Au chargement, `js/localisations.js` appelle `chargerLocalisations()`**, qui va chercher les données dans Supabase et **construit du HTML avec du JavaScript** :

```js
conteneur.innerHTML = localisations.map(loc => `
  <div class="card list-item card-clickable" data-id="${loc.id}">
    <div class="list-item-title">${escapeHtml(loc.nom)}</div>
  </div>
`).join('')
```

C'est ce qu'on appelle du **rendu côté client** : la page arrive presque vide, puis le JavaScript la remplit avec les vraies données. `escapeHtml()` est là pour la sécurité — elle empêche que le texte d'une note ou d'un nom contienne du code qui casserait la page (une faille qu'on a d'ailleurs corrigée en cours de route sur `outil-detail.html`).

**Étape 3 — Les clics sont branchés avec `addEventListener`** :
```js
document.getElementById('btn-ajouter').addEventListener('click', () => ouvrirModal(null))
```
*"Quand on clique sur l'élément dont l'id est `btn-ajouter`, exécute cette fonction."* C'est le mécanisme de base de l'interactivité en JavaScript.

**Étape 4 — Enregistrer un formulaire est asynchrone** :
```js
form.addEventListener('submit', async (e) => {
  e.preventDefault()               // empêche le rechargement de page par défaut du formulaire
  const { error } = await supabase.from('localisations').insert(valeurs)
  if (error) { afficherToast('Erreur'); return }
  afficherToast('Localisation enregistrée')
})
```
Le mot-clé **`await`** veut dire *"attends que cette opération réseau soit terminée avant de continuer"*. Sans lui, le code continuerait immédiatement sans attendre la réponse de Supabase — c'est le concept central de la programmation **asynchrone** en JavaScript, indispensable dès qu'on parle à internet.

---

## 6. Le design (CSS)

Tout le style visuel vient d'un seul fichier, [`css/style.css`](css/style.css), organisé autour de **variables** définies une fois en haut :

```css
:root {
  --ink: #0c0d0c;      /* fond très sombre */
  --gold: #cda449;     /* couleur d'accent */
  --font-head: 'Oswald', sans-serif;
}
```

Ensuite, partout ailleurs, on écrit `background: var(--ink)` plutôt que de répéter le code couleur. L'avantage : pour changer le thème au complet, on modifie seulement ces quelques lignes en haut, pas 500 lignes dispersées.

Les polices (`Oswald` pour les titres/boutons, `JetBrains Mono` pour les nombres) viennent de **Google Fonts**, chargées via un tag `<link>` dans le `<head>` de chaque page HTML.

---

## 7. Le code QR

Sur `outil-detail.html`, une librairie externe (`qrcodejs`, chargée par CDN) génère une image qui encode **l'adresse web complète de la fiche** (ex : `.../outil-detail.html?id=abc-123`). N'importe quel appareil photo de téléphone sait déjà lire un QR code et ouvrir le lien qu'il contient — donc scanner le code amène directement sur la fiche, sans app dédiée. C'est pour ça qu'on a retiré le lecteur intégré : il aurait fait exactement la même chose, en plus compliqué.

---

## 8. Glossaire rapide

| Terme | Explication simple |
|---|---|
| **Repo (dépôt)** | Le dossier de code, suivi par Git, hébergé sur GitHub |
| **Commit** | Un "instantané" enregistré d'un changement, avec un message qui le décrit |
| **Push** | Envoyer tes commits locaux vers GitHub |
| **API** | Un ensemble d'adresses web qu'un programme peut appeler pour parler à un autre service |
| **CDN** | Un serveur qui distribue des fichiers publics (librairies JS, polices) rapidement partout dans le monde |
| **Async/await** | Façon d'écrire du code qui attend une réponse réseau sans bloquer le reste de la page |
| **DOM** | La représentation en mémoire de la page HTML, que le JavaScript peut lire et modifier |
| **UUID** | Un identifiant unique généré aléatoirement (ex : `2c79dcfe-5f3d-...`), utilisé comme "numéro de série" de chaque ligne en base de données |
| **RLS** | Row Level Security — le système de permissions de Postgres, ligne par ligne |
| **CLI** | Command Line Interface — un outil qu'on utilise en tapant des commandes plutôt qu'en cliquant (ex : `gh`, `git`, `supabase`) |

---

## 9. Envie d'expérimenter ?

Quelques modifications simples pour te familiariser, sans risque de casser quoi que ce soit (tu peux toujours annuler avec `git checkout` si besoin, ou juste me demander) :

- **Changer une couleur** : modifie `--gold` dans `css/style.css`, sauvegarde, regarde le résultat
- **Ajouter une catégorie d'outil** : il faudrait l'ajouter à la fois dans les `<option>` des formulaires (HTML) et dans la logique de couleur (`css/style.css`, section catégories)
- **Voir tes données brutes** : va sur le Dashboard Supabase → Table Editor, tu verras exactement les lignes que l'app lit et écrit

Si tu veux qu'on approfondisse une section en particulier (Supabase, le JavaScript, le CSS, Git...), dis-le-moi — je peux étoffer ce document ou faire un exercice guidé.
