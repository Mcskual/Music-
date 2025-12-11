# Music — Prestations & Gestion

Site statique (HTML/CSS/JS vanilla) pour gérer prestations musicales, facturation et organisation personnelle. Le dossier principal `prestations/` est prêt pour un déploiement NAS (Synology Web Station).

## Structure rapide
- `prestations/` : pages HTML (prestations, facturation, rendez-vous, contrats/licences, suivi familial) et assets.
- `prestations/Sauvegarde/` : exports JSON horodatés.
- `docs/` : documentation projet et architecture.

## Documentation
- [Architecture cible et plan d’implémentation](docs/ARCHITECTURE.md)

## Déploiement NAS
- Copier le dossier `prestations/` dans le répertoire `web` de votre NAS (voir `prestations/README.txt`).
- Aucune dépendance serveur n’est requise à ce stade; toutes les données sont stockées en localStorage ou via export/import JSON.
