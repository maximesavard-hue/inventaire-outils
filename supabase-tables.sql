-- Script SQL à coller dans Supabase Dashboard → SQL Editor
-- Crée toutes les tables nécessaires pour l'app inventaire

-- 1. Localisations
CREATE TABLE localisations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Groupes
CREATE TABLE groupes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  type text DEFAULT 'Autre', -- Packout / Bac / Sac / Autre
  localisation_id uuid REFERENCES localisations(id),
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 3. Outils
CREATE TABLE outils (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  categorie text DEFAULT 'Autre', -- Électrique / Manuel / Échafaudage / Autre
  quantite integer DEFAULT 1,
  groupe_id uuid REFERENCES groupes(id), -- appartenance permanente (optionnel)
  dans_groupe boolean DEFAULT true, -- physiquement dans son groupe?
  localisation_id uuid REFERENCES localisations(id), -- si sorti du groupe
  prix_achat numeric,
  date_achat date,
  magasin text,
  numero_serie text,
  date_garantie date,
  notes text,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Notes
CREATE TABLE notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contenu text NOT NULL,
  type text DEFAULT 'Note', -- Note / Achat
  completee boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Désactive RLS : app personnelle, pas de multi-utilisateur (voir étape 2 du CLAUDE.md)
ALTER TABLE localisations DISABLE ROW LEVEL SECURITY;
ALTER TABLE groupes DISABLE ROW LEVEL SECURITY;
ALTER TABLE outils DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
