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

## Structure de la base de données

### Table `localisations`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| nom | text | Ex: Maison, Chalet, Chez Marie |
| notes | text | Optionnel |
| created_at | timestamp | Automatique |

### Table `groupes`
| Champ | Type | Description |
|-------|------|-------------|
| id | uuid | Automatique |
| nom | text | Ex: Packout rouge, Bac échafaudage |
| type | text | Packout / Bac / Sac / Autre |
| localisation_id | uuid | FK → localisations |
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
├── css/
│   └── style.css           # Styles globaux
├── js/
│   ├── supabase.js         # Config et client Supabase (déjà créé)
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

## V2 — Features prévues (ne pas implémenter maintenant)
- Liste d'achats (filtrer notes par type = Achat)
- Fiche d'achat avec reçu photo
- Tracker de remboursement outil acheté perso / loué à l'entreprise
- Historique des mouvements d'un outil
- Multi-utilisateur (partage avec père pour le chalet)
