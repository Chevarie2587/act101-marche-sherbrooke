# Marché Populaire de Sherbrooke

Site vitrine et réservation de démonstration — HTML, CSS, JavaScript, Three.js et Vite.

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

## Contenus à remplacer
Adresse demandée : 00 rue Wellington, Sherbrooke (indicative).
Téléphone fictif : 819 555-0100. Courriel fictif : bonjour@marchepopulaire.example.
Horaires proposés, entreprises fictives et événements non confirmés sont identifiés
comme tels sur le site. Aucun véritable partenaire, exposant ou événement n’est annoncé.
L’image est une illustration d’ambiance fournie; vérifier les droits avant diffusion publique.

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

Documentation : https://threejs.org/ et https://vite.dev/
