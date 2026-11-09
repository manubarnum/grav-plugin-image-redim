# v2.1.0
## 2026-11-09

1. [](#new)
    * English by default, French translation in `languages.yaml` (settings and resize panel)
    * Panel strings translated server-side in the user's admin language and passed in the widget `config`
2. [](#improved)
    * Widget scoped to the Pages screens with `routes: ['/pages']`; the script stays idle elsewhere
    * Errors use Admin 2 toasts (`window.__GRAV_TOAST`) instead of a blocking `alert()`
    * Config read through `window.__GRAV_API` when available
    * README: Editor Pro is not supported

# v2.0.3
## 2026-11-09

1. [](#improved)
    * README en anglais (version française dans `README.fr.md`)
    * Description bilingue anglais / français dans `blueprints.yaml`
    * Section `compatibility` (Grav 2.0) et liens `docs` / `bugs` pour le catalogue GPM

# v2.0.2
## 2026-11-09

1. [](#bugfix)
    * Les proportions conservées produisent `resize=800` au lieu de `resize=800,0`, que la bibliothèque d'images de Grav 2 traite comme une hauteur nulle (image d'erreur `fallback.jpg`)

# v2.0.1
## 2026-11-09

1. [](#bugfix)
    * Prise en charge des noms de fichiers avec espaces : `![alt](<Sans titre.jpg>)`

# v2.0.0
## 2026-11-09

1. [](#new)
    * Réécriture pour Grav 2 / Admin 2 : script chargé comme widget invisible, accroché à l'éditeur CodeMirror 6
    * Bouton « Redimensionner » au survol ou au curseur sur une image Markdown

# v1.0.0
## 2026-11-09

1. [](#new)
    * Version initiale pour l'admin classique (Grav 1.7)
