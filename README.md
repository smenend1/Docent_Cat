# DocentCat v7 · Menú lateral més clar

PWA estàtica per a GitHub Pages. No necessita backend ni compilació.

## Novetats v7

- Interfície més clara: el menú lateral queda identificat com a **Dades comunes**.
- Cada mòdul central explica quins camps són **específics** d'aquella generació.
- Guia superior amb el flux: menú lateral → centre de pantalla → genera.
- Les sortides generades separen **dades comunes del menú lateral** i **dades específiques del mòdul**.
- Labels i textos d'ajuda millorats perquè sigui més evident què afecta a SA, fitxes, sessions, rúbriques o feedback.
- Botó **Paquet complet**: genera SA, sessions, fitxa, rúbrica, feedback i plantilla en un sol HTML.
- Exportació **HTML**, **Word (.doc)**, **TXT** i impressió/PDF des del navegador.
- Fitxes més específiques quan la consigna indica quantitats i tipus d'exercicis.
- Millor interpretació de consignes com: `5 exercicis de factorització, 5 amb fórmula general, 2 problemes contextualitzats`.
- Plantilles editables i sortides modificables dins l'app.
- Service worker actualitzat per evitar memòria cau antiga.

## Instal·lació a GitHub Pages

1. Puja tots els fitxers a l'arrel del repositori.
2. Ves a `Settings > Pages`.
3. Tria `Deploy from a branch`, branca `main`, carpeta `/root`.
4. Obre la web amb `?v=7` per evitar memòria cau:

```text
https://el-teu-usuari.github.io/DocentCat/?v=7
```

## Estructura mínima

```text
index.html
styles.css
app.js
manifest.webmanifest
service-worker.js
curriculum-data.js
data/curriculum-data.js
icons/icon-192.png
icons/icon-512.png
.nojekyll
```

## Nota honesta

La base curricular inclosa és operativa i editable, però encara no és una transcripció oficial exhaustiva i revisada matèria per matèria. El següent pas és crear una versió STEM amb currículum complet i verificat per Matemàtiques, Matemàtiques A/B, Tecnologia i Digitalització, Tecnologia, Digitalització, Biologia i Geologia, Física i Química.
