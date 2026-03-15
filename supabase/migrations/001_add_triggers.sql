-- Migration : ajouter la colonne triggers à la table clients (base existante)
-- Exécuter dans l'éditeur SQL Supabase si la table clients existe déjà sans cette colonne.

alter table clients
add column if not exists triggers jsonb default '[]';
