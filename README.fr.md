# Image Redim — plugin Grav 2 / Admin 2

🇬🇧 [English version](README.md)

Redimensionnement visuel des images dans l'éditeur Markdown d'Admin 2.

Auteur : Enkirche

## Prérequis

- Grav 2.x
- Plugins **api** et **admin2**
- L'éditeur Markdown par défaut d'Admin 2 (CodeMirror)

## Installation

1. Copier le dossier `image-redim` dans `user/plugins/`.
2. Vider le cache.
3. Recharger complètement l'admin (Ctrl+F5).
4. Réglages : Admin → Plugins → Image Redim.

## Utilisation

Dans l'éditeur, survolez une image `![alt](photo.jpg)` ou placez le curseur dessus.
Un bouton « ⤡ Redimensionner » apparaît. Il ouvre un panneau avec :
- l'aperçu de l'image et une poignée à tirer à la souris ;
- les champs largeur et hauteur, et le verrouillage des proportions ;
- le choix de la méthode.

« Appliquer » réécrit l'image, par exemple :
`![alt](photo.jpg?resize=800)` ou `![alt](photo.jpg?width=800&height=533)`.

## Méthodes

| Méthode | Résultat |
|---|---|
| `resize` | Grav génère une copie redimensionnée (page plus légère). Largeur seule (`resize=800`) = hauteur proportionnelle. |
| `cropResize` | Redimensionne pour tenir dans le cadre sans déformer. |
| `html` | Image d'origine inchangée, ajout des attributs `width`/`height`. |

Les autres paramètres déjà présents dans l'URL de l'image (`classes`, `lightbox`, `quality`…) sont conservés.

## Fonctionnement technique

Admin 2 ne charge pas les CSS et JS des plugins via Twig. Le plugin déclare donc
un widget flottant invisible (`onApiFloatingWidgets`, `autoLoad: true`, `showFab: false`).
Le widget est limité aux écrans Pages (`routes: ['/pages']`) : Admin 2 ne charge
`admin-next/widgets/image-redim.js` que là, et le script s'accroche aux éditeurs
CodeMirror 6 de la page.

Les textes de l'interface sont traduits côté serveur à partir de `languages.yaml`,
dans la langue d'administration de l'utilisateur (anglais par défaut, français inclus),
puis transmis au script dans la `config` du widget. Les erreurs s'affichent dans
une notification (toast) d'Admin 2.

## Limites

- Seul l'éditeur Markdown par défaut d'Admin 2 (CodeMirror) est pris en charge. **Editor Pro** ne l'est pas.
- L'aperçu dans le panneau fonctionne pour les images de la page (médias).
  Pour une image externe, la saisie numérique reste possible.

## Dépannage

Dans la console du navigateur (F12), vous devez voir :

```
[Image Redim] loaded
[Image Redim] editor detected
```

Si rien n'apparaît : vérifiez que le plugin est activé, videz le cache, puis ouvrez
la liste **Pages** et la page à partir de là.
