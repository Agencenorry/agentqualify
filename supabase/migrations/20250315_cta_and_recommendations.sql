-- CTA configurable (clients) + recommandations (leads)
alter table clients add column if not exists cta_text text default 'Réserver une démo';
alter table clients add column if not exists cta_url text;

alter table leads add column if not exists recommendations jsonb default '[]';
