# Marché Populaire de Sherbrooke

Site vitrine et réservation de démonstration — HTML, CSS, JavaScript, Three.js et Vite.
Aucune mention « prototype scolaire » dans le site.

## Démarrer sur Windows / VS Code
1. Installer Node.js 22 LTS (22.12 ou plus récent).
2. Extraire complètement le ZIP.
3. Dans VS Code : Fichier > Ouvrir un dossier > sélectionner le dossier contenant package.json.
4. Terminal > Nouveau terminal :

```sh
npm install
npm run dev
```

Ouvrir l’adresse locale affichée. Garder le terminal ouvert; Ctrl+C pour arrêter.
Ne pas double-cliquer sur index.html. Une connexion Internet est nécessaire pour
installer les dépendances; aucune police distante ni CDN ne sont utilisés ensuite.
Si PowerShell bloque npm.ps1, utiliser Command Prompt ou npm.cmd à la place de npm.

## Les pages
- #/ : accueil, vision du marché, catégories, entreprises exemples, programmation envisagée.
- #/reservation : plan interactif, 16 kiosques, deux niveaux, dates et équipements.
- #/contact : coordonnées indicatives, horaires et formulaire sans envoi.

## Organisation
- src/data.js : coordonnées, kiosques, tarifs, équipements.
- src/main.js : pages, formulaires, disponibilité locale, calcul du total.
- src/scene.js : bâtiment, mobilier, caméra, sélection et modes d’étage.
- src/style.css : tout le style et l’adaptation mobile.
- public/marche.jpg : image d’ambiance fournie par le demandeur.
- index.html : document de démarrage.

## Plan et hypothèses
Inspiré du schéma fourni : allée centrale, espaces de vente latéraux, mezzanine
ouverte sur le hall et galerie au fond. 8 kiosques par étage, 16 en tout.
Le modèle est volontairement schématique et non coté : emprise fictive 24 × 24 m,
hauteur d’étage 4,2 m, kiosques de 3,5 × 3,5 m ou 4 × 3,5 m.
Le garde-corps est illustratif, sans valeur réglementaire. Aucun escalier ni issue
n’est inventé : leurs positions restent à relever. Les colonnes sont indicatives.
La façade avant et le toit sont retirés pour lire le plan. Pas de restitution
architecturale fidèle, pas de plan de travaux, pas de validation d’accessibilité.
Les trois vues permettent de voir les deux niveaux ou un seul à la fois.
Une liste accessible au clavier remplace la sélection 3D si WebGL est indisponible.

## Réservations
- Dates inclusives : du lundi au mardi = 2 jours de location.
- Total = jours × (tarif du kiosque + somme des quantités × prix des équipements).
- Prix fictifs en CAD, taxes non calculées, sans paiement.
- Un kiosque réservé localement est indisponible si les intervalles se chevauchent.
- Les dates passées ne peuvent pas être réservées.
- Tables, chaises, réfrigérateurs, congélateurs et présentoirs : quantités plafonnées,
  mais aucun inventaire global ou contrôle des prises / besoins électriques.
- Réservations sauvegardées dans localStorage, limitées à cette origine et ce navigateur.
- Nom, entreprise, courriel, téléphone, catégorie et notes sont demandés pour montrer
  le parcours, mais ne sont pas sauvegardés et ne sont envoyés nulle part.
- Le formulaire contact valide les champs puis affiche une confirmation de test.
- Ne pas saisir de données personnelles réelles.
- Annulation possible depuis la liste sous le plan, avec confirmation.

Ce n’est PAS un système de réservation de production : pas de backend, authentification,
protection contre la modification locale ni verrou transactionnel multiutilisateur.
La mise à jour entre onglets réduit les incohérences d’affichage mais ne garantit
pas l’absence de réservation concurrente. Un serveur et une base de données avec
validation atomique sont nécessaires pour une exploitation réelle.

## Contenus à remplacer
Adresse demandée : 00 rue Wellington, Sherbrooke (indicative).
Téléphone fictif : 819 555-0100. Courriel fictif : bonjour@marchepopulaire.example.
Horaires proposés, entreprises fictives et événements non confirmés sont identifiés
comme tels sur le site. Aucun véritable partenaire, exposant ou événement n’est annoncé.
L’image est une illustration d’ambiance fournie; vérifier les droits avant diffusion publique.

## Tests manuels conseillés
1. Accueil : image, liens, catégories, navigation et pied de page.
2. Réservation : tourner, zoomer, recentrer, isoler chaque étage.
3. Vérifier 8 kiosques par niveau et 16 dans la vue générale.
4. Sélectionner via le plan et via les boutons au clavier.
5. Choisir 2 jours + 2 tables : équipement = 40 $, total = 2 × tarif kiosque + 40 $.
6. Soumettre avec champs manquants pour tester la validation native.
7. Enregistrer une réservation fictive, recharger et vérifier le blocage des dates.
8. Vérifier qu’une période non chevauchante reste disponible.
9. Annuler la réservation et constater la remise à disposition.
10. Tester les dates inversées/passées, le stockage bloqué, le contact et une fenêtre mobile.
11. Sans WebGL, vérifier que la liste et le formulaire restent utilisables.

## Construire et remettre
```sh
npm run build
npm run preview
```
`dist/` est le site construit, à servir par HTTP ou héberger comme site statique.
Les routes avec # évitent de configurer une réécriture serveur pour ces trois pages.
Pour remettre le code : inclure src, public, index.html, package.json, README.md,
.gitignore et le package-lock.json créé par npm install. Exclure node_modules.
Avec un verrou présent, npm ci permet une réinstallation reproductible.
Le ZIP initial ne contient pas de verrou, car npm n’a pas été exécuté ici.

## Validation de la livraison
Fichiers et archive vérifiés lors de la génération. Installation npm, build et tests
navigateur non exécutés dans l’environnement de génération : à effectuer localement.
Versions épinglées pour le projet, non présentées comme les plus récentes; réviser
les dépendances et leur sécurité avant toute publication de production.

Documentation : https://threejs.org/ et https://vite.dev/
