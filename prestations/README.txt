Prestations — Clips & Musique (Synology Web Station)

Ce dossier est prêt pour être déposé sur votre NAS Synology et servi en local via Web Station.

Étapes (DSM 7.x) — Méthode simple :
1) Installez **Web Station** depuis le Centre de paquets (Package Center).
   (Aucune base de données ou PHP n'est nécessaire pour ce projet.)
2) Dans **File Station**, ouvrez le dossier partagé **web** (créé par Web Station).
3) Glissez le dossier **prestations** (celui qui contient ce fichier et index.html) dans **web**.
4) Accédez depuis votre navigateur à : http://IP_DU_NAS/prestations/  (ex: http://192.168.1.20/prestations/)
   ou http://NOM_DU_NAS.local/prestations/
5) Ajoutez vos prestations. La sauvegarde est automatique (localStorage).

Remarques importantes :
- Évitez la navigation privée/Incognito (certains navigateurs bloquent localStorage).
- Gardez la même URL (IP, nom DNS, ou QuickConnect) pour retrouver vos données, car le stockage est "par domaine".
- Pour sauvegarder sur disque, utilisez **Exporter JSON** et conservez le fichier dans un dossier de votre NAS.
  Vous pourrez plus tard **Importer JSON** pour restaurer vos données.
- Si vous ne voyez pas la sauvegarde automatique :
    • Vérifiez le message d’état (bandeau vert/rouge en haut).
    • Essayez un montant simple (ex: 800).
    • Vérifiez la Console du navigateur (F12 > Console) et notez l’erreur.

URL exemples :
- http://192.168.1.20/prestations/
- http://mon-nas.local/prestations/

Sécurité / HTTPS (optionnel) :
- Vous pouvez activer HTTPS via le Gestionnaire de certificats et un hôte virtuel Web Station si vous le souhaitez.
