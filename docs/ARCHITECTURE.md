# Transformation du site en outil métier complet

## 1. Analyse de la structure actuelle
- **Technos** : pages HTML/CSS/JS statiques (vanilla) dans `prestations/`. Pas de backend.
- **Persistance** : usage intensif de `localStorage` et export/import JSON; dossiers de sauvegarde JSON dans `prestations/Sauvegarde/`.
- **Pages existantes** :
  - `index.html` (prestations/projets), `facturation.html` / `facture.html`, `rdv.html`, `licence.html`, `reverb.html`, `famille.html`.
  - Assets : logos (`szd_logo*.png`) et README pour déploiement NAS.
- **Déploiement actuel** : copie du dossier `prestations` sur un NAS Synology Web Station (hébergement statique).
- **Problèmes observés** : logique métier et styles imbriqués dans des pages monolithiques; réutilisation limitée; difficile d’étendre vers de nouveaux modules sans duplication.

## 2. Architecture cible (modulaire, NAS-friendly)
Objectif : conserver le déploiement statique initial tout en séparant l’UI, la logique métier et les données pour faciliter l’évolution vers un backend léger.

```
prestations/
├── assets/           # logos, icônes, styles globaux (CSS)
├── data/             # JSON d’amorçage et exports manuels
├── modules/          # JS par domaine métier (clients, projets, facturation, etc.)
│   ├── clients/
│   ├── projets/
│   ├── facturation/
│   ├── rdv/
│   ├── contrats/
│   └── famille/
├── services/         # services transverses (storage, numérotation, pdf, calendrier)
├── ui/               # composants UI réutilisables (tableaux, formulaires, badges)
├── styles/           # thèmes, variables, reset, layouts
├── index.html        # point d’entrée tableau de bord
└── ...               # pages spécialisées (facturation.html, etc.) réécrites pour consommer les modules
```

Principes :
- **Séparation stricte** (UI vs. logique métier vs. données).
- **Modules autonomes** avec API claire (`init`, `load`, `save`, `render`).
- **Stockage** : abstraction `services/storageService.js` (LocalStorage + fallback fichier JSON) pour préparer une future base SQL/NoSQL.
- **Thèmes et design system** regroupés dans `styles/` + tokens CSS.
- **Compatibilité NAS** : tout fonctionne en statique; options PHP/API ajoutables plus tard via `services/apiClient.js`.

## 3. Découpage des modules
### Projets / Instrumentales (sans audio)
- Fiches (nom, référence interne, statut commercial, prix, client associé).
- Liaison contrats/factures + historique des actions.
- Filtres (statut, client) et recherche globale.

### Facturation
- Création devis/factures, numérotation auto, statuts (brouillon, envoyé, payé, partiel).
- Calcul taxes/remises, totaux HT/TTC, échéancier.
- Historique client, export PDF (html2pdf ou équivalent léger côté client).

### Rendez-vous
- Agenda jour/mois, créneaux, association client/projet, notes internes.
- Rappels locaux (Notification/ICS) optionnels.

### Contrats d’instrumentales
- Modèles (non exclusif / exclusif) avec placeholders dynamiques.
- Génération PDF/HTML, archivage, liaison projet/facture.

### Clients
- Fiche contact, tags internes, historique projets/factures/contrats, notes.
- Vue timeline par interactions.

### Gestion familiale (privé)
- Suivi dépenses/épargne, rappels, vue mensuelle.
- Stockage séparé (`storageService` avec namespaces) pour cloisonner les données pro/perso.

## 4. Plan d’implémentation par étapes
1) **Extraction du design system** : déplacer variables CSS et composants communs dans `styles/` + `ui/` (boutons, cartes, tableaux).
2) **Service de stockage** : créer `services/storageService.js` (namespace + fallback fichier JSON) et migrer `index.html` puis `facturation.html`.
3) **Module Clients** : `modules/clients/clientsService.js` (CRUD, validation, recherche) + UI liste/détail.
4) **Module Projets** : `modules/projets/projetsService.js` (statuts, prix, liens clients) + historique actions.
5) **Module Facturation** : `modules/facturation/invoicesService.js` (numérotation, calcul montants) + `services/pdfService.js` pour export.
6) **Module Rendez-vous** : `modules/rdv/rdvService.js` avec vues jour/mois et lien client/projet.
7) **Module Contrats** : `modules/contrats/templates.js` (placeholders), générateur de document, archivage.
8) **Module Famille** : migrer `famille.html` vers `modules/famille` avec stockage isolé.
9) **Navigation et dashboard** : page `index.html` modernisée pour piloter toutes les sections + recherche globale.
10) **Préparation backend futur** : interface `services/apiClient.js` pour basculer LocalStorage → API sans toucher aux modules.

## 5. Exemples de fichiers et fonctions clés
- `services/storageService.js`
  - `init(namespace)` : prépare les clés et le fallback fichier JSON.
  - `load(key, defaultValue)` / `save(key, data)` : I/O unique pour LocalStorage + hook de validation.
- `services/numberingService.js`
  - `nextInvoiceNumber(prefix="INV")` : génère un numéro chronologique YYYY-#### avec persistance.
- `modules/facturation/invoicesService.js`
  - `createInvoice({ clientId, items, taxes, status })`, `updateStatus(id, status)`, `totalize(invoice)`.
- `modules/contrats/templates.js`
  - `renderContract(templateId, payload)` : remplace placeholders (artiste, producteur, prix, durée) et renvoie HTML prêt pour PDF.
- `ui/table.js`
  - `renderTable({ columns, rows, filters })` : tableaux responsives + filtres + actions.

## 6. Recommandations pour hébergement NAS
- **Statique d’abord** : conserver la compatibilité Web Station (pas de dépendances lourdes; JS vanilla). Bibliothèques optionnelles embarquées en local (html2pdf, date-fns minifié).
- **Versionnement des données** : exports réguliers JSON dans `data/` + sauvegardes automatiques horodatées (comme `Sauvegarde/`).
- **Séparation pro/perso** : utiliser des namespaces distincts dans `storageService` (`pro-*`, `perso-*`).
- **Durabilité** : prévoir un script de migration (`services/migrations.js`) pour mettre à jour les structures JSON lors des évolutions.
- **Sécurité minimale** : si une couche PHP est ajoutée plus tard, limiter l’exécution à un espace privé/authentifié (HTTP Auth ou SSO NAS) et filtrer toute I/O.

Cette architecture permet d’étendre progressivement le site existant sans le casser, tout en préparant une future bascule vers une API ou une base de données lorsque nécessaire.
