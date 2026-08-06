-- Script SQL à coller dans Supabase Dashboard → SQL Editor
-- Crée toutes les tables nécessaires pour l'app inventaire

-- 1. Localisations
CREATE TABLE localisations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Catégories d'outils (gérées dans parametres.html, pas hardcodées)
CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL UNIQUE,
  couleur text NOT NULL DEFAULT '#9a9d97',
  created_at timestamp with time zone DEFAULT now()
);

INSERT INTO categories (nom, couleur) VALUES
  ('Électrique', '#4a90d9'),
  ('Manuel', '#b47fd4'),
  ('Échafaudage', '#e0954a'),
  ('Autre', '#9a9d97');

-- 3. Types de groupe (gérés dans parametres.html, pas hardcodés)
CREATE TABLE types_groupe (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL UNIQUE,
  couleur text NOT NULL DEFAULT '#9a9d97',
  created_at timestamp with time zone DEFAULT now()
);

INSERT INTO types_groupe (nom, couleur) VALUES
  ('Packout', '#4a90d9'),
  ('Bac', '#b47fd4'),
  ('Sac', '#5fbf6b'),
  ('Autre', '#9a9d97');

-- 4. Groupes
-- Un groupe est un contenant (packout, bac...), qui peut lui-même être un objet
-- acheté (d'où les champs prix_achat / numero_serie / etc., comme sur outils)
CREATE TABLE groupes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  type_id uuid REFERENCES types_groupe(id),
  localisation_id uuid REFERENCES localisations(id),
  prix_achat numeric,
  date_achat date,
  magasin text,
  numero_serie text,
  date_garantie date,
  photo_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 5. Outils
CREATE TABLE outils (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  categorie_id uuid REFERENCES categories(id),
  quantite integer DEFAULT 1,
  groupe_id uuid REFERENCES groupes(id), -- appartenance permanente (optionnel)
  dans_groupe boolean DEFAULT true, -- physiquement dans son groupe?
  localisation_id uuid REFERENCES localisations(id), -- si sorti du groupe
  prix_achat numeric,
  date_achat date,
  magasin text,
  numero_serie text,
  date_garantie date,
  photo_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Notes
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contenu text NOT NULL,
  type text DEFAULT 'Note', -- Note / Achat
  completee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Désactive RLS : app personnelle, pas de multi-utilisateur (voir étape 2 du CLAUDE.md)
ALTER TABLE localisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE types_groupe DISABLE ROW LEVEL SECURITY;
ALTER TABLE groupes DISABLE ROW LEVEL SECURITY;
ALTER TABLE outils DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;

-- 7. Stockage des photos (outils et groupes)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos lecture publique" on storage.objects
  for select using (bucket_id = 'photos');
create policy "photos ecriture" on storage.objects
  for insert with check (bucket_id = 'photos');
create policy "photos modification" on storage.objects
  for update using (bucket_id = 'photos');
create policy "photos suppression" on storage.objects
  for delete using (bucket_id = 'photos');
