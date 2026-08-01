# Inventaire Outils — Brief Claude Code

## Contexte du projet
Application web personnelle pour inventorier des outils physiques (électriques, manuels, échafaudages, etc.).
Besoin principal : savoir **quoi** j'ai, **combien**, et **où** c'est en tout temps.
Accessible autant sur **mobile** que **desktop**. Hébergé sur GitHub Pages.

## Philosophie de développement
- **Simple avant tout** — code lisible, pas de sur-ingénierie
- **Gratuit et durable** — pas de dépendances payantes
- **Évolutif** — structure saine pour ajouter des features en V2 sans refactoring
- **Stack** : HTML + JavaScript vanilla + Supabase + GitHub Pages

---

## SETUP INITIAL — À faire en premier

### 1. Créer les tables Supabase
Aller dans : https://supabase.com/dashboard/project/twzttyglnloshujwnlkx/sql/new
Coller et exécuter le contenu de `supabase-tables.sql`

### 2. Activer les permissions (RLS)
Dans Supabase Dashboard → Table Editor → chaque table → RLS :
Pour l'instant, désactiver RLS sur les 4 tables (app personnelle, pas de multi-user)
Ou créer une policy "allow all" sur chaque table.

### 3. Lier GitHub
Dans Supabase Dashboard → Project Settings → Integrations → GitHub
Connecter le repo `inventaire-outils`

### 4. GitHub Pages
Dans le repo GitHub → Settings → Pages → Source : Deploy from branch → main → / (root)

---

## Connexion Supabase

```javascript
const SUPABASE_URL = 'https://twzttyglnloshujwnlkx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_U_0EkEYJJGuz-IrhZSc9Vw_14UzaY3f'
```

---

## État actuel du déploiement

*Section tenue à jour par Claude au fil des sessions — c'est la source de vérité pour reprendre le travail, peu importe la machine utilisée (contrairement à la mémoire locale de Claude, ce fichier est versionné avec Git et suit le repo partout).*

- **Repo GitHub** : `maximesavard-hue/inventaire-outils` (public) — https://github.com/maximesavard-hue/inventaire-outils
- **Site en ligne** : https://maximesavard-hue.github.io/inventaire-outils/ (GitHub Pages, déploie automatiquement à chaque push sur `main`)
- **Projet Supabase** : ref `twzttyglnloshujwnlkx`, nommé « ToolsApps » dans le dashboard Supabase (aucun rapport avec un repo GitHub — ce nom n'existe que côté Supabase)
- Les 4 tables sont créées (`supabase-tables.sql`), **RLS désactivé volontairement** sur les 4 (app mono-utilisateur — voir section RLS dans `APPRENTISSAGE.md` si jamais un 2e utilisateur est ajouté, il faudra revisiter ce choix)
- Photos : bucket Supabase Storage `photos` (public, sans authentification — même logique que le RLS désactivé). Colonne `photo_url` sur `outils` et `groupes`. Upload géré par `js/photo.js` (redimensionnement côté client avant envoi).
- Design : thème « industriel-luxe » — fond charbon `#0c0d0c`, accent doré `#cda449`, polices Oswald (titres/boutons) + JetBrains Mono (données chiffrées), inspiré du projet perso `PresenceSolotech` de l'utilisateur. Code couleur par catégorie d'outil (bordure gauche + badge) dans `css/style.css`.
- QR code par outil sur `outil-detail.html` (librairie `qrcodejs` via cdnjs) encodant le lien direct vers la fiche — imprimable/téléchargeable pour coller sur l'outil physique. **Pas de scanner intégré à l'app** : retiré volontairement, redondant avec l'appareil photo natif de n'importe quel téléphone qui lit déjà les QR codes.
- `APPRENTISSAGE.md` à la racine : doc pédagogique pour l'utilisateur (ne connaît pas le dev web/Supabase), à tenir à jour si l'architecture change significativement.
- Outils CLI utilisés pour administrer ce projet (installation + authentification **par machine**, non synchronisées entre tour/laptop) :
  - `gh` (GitHub CLI) — installé via winget, `C:\Program Files\GitHub CLI\gh.exe`
  - Supabase CLI — installé manuellement (binaire GitHub releases), `$env:LOCALAPPDATA\supabase-cli\supabase.exe`
  - Sur une nouvelle machine : `gh auth login` et `& "$env:LOCALAPPDATA\supabase-cli\supabase.exe" login` (ou réinstaller le binaire d'abord), puis `supabase link --project-ref twzttyglnloshujwnlkx`
  - Ni `git`, ni `gh` ne sont dans le PATH par défaut d'une session PowerShell fraîche sur cette tour — utiliser le chemin complet ou faire `$env:Path = "C:\Program Files\Git\bin;C:\Program Files\GitHub CLI;" + $env:Path` en début de session si besoin

---

## Structure de la base de données

### Table `localisations`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| nom | text | Ex: Maison, Chalet, Chez Marie |
| notes | text | Optionnel |
| created_at | timestamp | Automatique |

### Table `groupes`
Un groupe est un contenant (packout, bac, sac...), mais c'est aussi souvent un objet acheté en soi (ex : un bac Milwaukee Packout a son propre numéro de modèle, prix, date d'achat). D'où les mêmes champs d'achat/garantie que sur `outils`.

| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| nom | text | Ex: Packout rouge, Bac échafaudage |
| type | text | Packout / Bac / Sac / Autre |
| localisation_id | uuid | FK → localisations |
| prix_achat | numeric | Optionnel |
| date_achat | date | Optionnel |
| magasin | text | Optionnel |
| numero_serie | text | Optionnel |
| date_garantie | date | Optionnel |
| photo_url | text | URL publique de la photo (bucket Storage `photos`), optionnel |
| notes | text | Optionnel |
| created_at | timestamp | Automatique |

### Table `outils`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| nom | text | Ex: Plaque vibrante, Perceuse |
| categorie | text | Électrique / Manuel / Échafaudage / Autre |
| quantite | integer | Par défaut 1 |
| groupe_id | uuid | FK → groupes (optionnel, appartenance permanente) |
| dans_groupe | boolean | Est-il physiquement dans son groupe? |
| localisation_id | uuid | FK → localisations (si sorti du groupe ou sans groupe) |
| prix_achat | numeric | Optionnel |
| date_achat | date | Optionnel |
| magasin | text | Optionnel |
| numero_serie | text | Optionnel |
| date_garantie | date | Optionnel |
| photo_url | text | URL publique de la photo (bucket Storage `photos`), optionnel |
| notes | text | Optionnel |
| created_at | timestamp | Automatique |

**Logique de localisation (priorité) :**
1. Si `dans_groupe = true` → hérite la localisation de son groupe
2. Si `dans_groupe = false` → utilise son propre `localisation_id`
3. Si pas de groupe → utilise son propre `localisation_id`

### Table `notes`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| contenu | text | Le texte de la note |
| type | text | Note / Achat (préparé pour V2) |
| completee | boolean | Par défaut false |
| created_at | timestamp | Automatique |

---

## Structure des fichiers à créer

```
inventaire-outils/
├── index.html              # Dashboard principal
├── outils.html             # Liste et gestion des outils
├── groupes.html            # Liste et gestion des groupes
├── localisations.html      # Gestion des localisations
├── notes.html              # Bloc-notes / todo
├── outil-detail.html       # Fiche détaillée d'un outil
├── groupe-detail.html      # Fiche détaillée d'un groupe (contenant + achat/garantie)
├── css/
│   └── style.css           # Styles globaux
├── js/
│   ├── supabase.js         # Config et client Supabase (déjà créé)
│   ├── photo.js            # Upload/redimensionnement des photos (outils + groupes)
│   ├── outils.js           # Logique outils
│   ├── groupes.js          # Logique groupes
│   ├── localisations.js    # Logique localisations
│   └── notes.js            # Logique notes
├── supabase-tables.sql     # Script SQL (déjà créé)
└── CLAUDE.md               # Ce fichier
```

---

## UI / UX

- **Mobile first** — boutons larges, navigation simple en bas de page
- **Dashboard** = vue rapide : outils non localisés, notes non complétées
- **Couleurs** : sobre, professionnel, pas de fioritures
- Langue de l'interface : **Français**
- Chaque page HTML charge Supabase via CDN :
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase.js"></script>
```

---

## Règles de développement

- Pas de frameworks (pas de React, Vue, etc.)
- Pas de build tools (pas de webpack, vite, etc.)
- Chaque page fonctionne indépendamment
- JS commenté en français
- Préférer la simplicité à l'élégance
- Tester sur mobile à chaque étape

---

## Notes de collaboration avec Claude

- L'utilisateur (Maxime) ne connaît pas le développement web ni Supabase — expliquer les décisions techniques en langage simple plutôt que d'exécuter silencieusement. `APPRENTISSAGE.md` est là pour l'aider à monter en compétence, pas juste utiliser l'app.
- Une fois `gh` et le CLI Supabase authentifiés sur la machine utilisée (voir section « État actuel du déploiement »), agir de façon autonome pour git/gh/supabase (commits, push, requêtes SQL, déploiement) sans redemander confirmation à chaque étape. Rester attentif seulement si une action est structurellement ambiguë (ex : nom de repo, choix qui engage l'architecture).
- Préférer retirer une fonctionnalité plutôt que de garder du code redondant, même si elle a déjà été construite et fonctionne (ex : le scanner QR intégré, retiré après coup car redondant avec l'appareil photo natif). Signaler proactivement une redondance avant de construire quelque chose, plutôt que d'attendre qu'on le demande.

---

## V2 — Features prévues (ne pas implémenter maintenant)
- Liste d'achats (filtrer notes par type = Achat)
- Fiche d'achat avec reçu photo
- Tracker de remboursement outil acheté perso / loué à l'entreprise
- Historique des mouvements d'un outil
- Multi-utilisateur (partage avec père pour le chalet)
