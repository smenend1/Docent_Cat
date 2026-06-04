# DocentCat PWA v10.2 · capçalera i memòria cau corregides

Versió per a GitHub Pages.

## Novetats v10.2

- Correcció de **Tecnologia de 4t d'ESO**: 6 competències específiques i tots els criteris d'avaluació vinculats.
- Correcció de **Tecnologia i Digitalització de 1r, 2n i 3r d'ESO**: 7 competències específiques i tots els criteris d'avaluació vinculats.
- Nou comportament: quan selecciones una o més **CE**, el desplegable de **CA** s'actualitza i mostra només els criteris associats.
- Es manté el panell compacte amb botons quadrats i totes les exportacions: HTML, Word, TXT, impressió/PDF, JSON de projecte i importació de currículum.

## Publicació a GitHub Pages

1. Puja tots els fitxers del ZIP al repositori.
2. Ves a **Settings > Pages**.
3. Selecciona **Deploy from a branch**, branca `main`, carpeta `/root`.
4. Obre la web afegint `?v=10.1.1` al final de la URL per evitar memòria cau.

Exemple:

```text
https://smenend1.github.io/DocentCat/?v=10.1.1
```

## Nota important

Aquesta versió corregeix i vincula CE/CA de Tecnologia i Tecnologia i Digitalització. La resta de matèries encara poden contenir una base operativa no exhaustiva fins que es revisin una per una amb el currículum oficial.


## Correcció v10.2

Quan es trien diverses CE, la generació de SA, fitxes, rúbriques i paquet complet conserva tots els CA seleccionats o, si no se selecciona cap CA manualment, inclou tots els CA vinculats a les CE triades.


## Nota v10.2
La capçalera visible, el títol del navegador, el manifest i el service worker indiquen v10.2. També s'ha eliminat la referència antiga v8 del comentari de CSS.
