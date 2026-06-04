# DocentCat v8 · Panell compacte

PWA per a docents de secundària a Catalunya. Aquesta versió substitueix la pantalla amb menú lateral llarg per un panell principal de botons quadrats.

## Novetats v8

- Pantalla inicial compacta tipus panell de control.
- Botons quadrats per a:
  - Dades comunes
  - Currículum
  - SA
  - Sessions
  - Fitxes
  - Rúbriques
  - Feedback
  - Plantilles
  - Exportar / importar
- Cada botó obre una finestra de configuració.
- El botó **Accepta i torna** tanca la finestra i torna al panell inicial.
- Es mantenen les opcions de còpia, HTML, Word, TXT i impressió/PDF.
- S'afegeix exportació i importació de projecte en JSON.
- Es manté la importació de currículum propi en JSON.

## Publicació a GitHub Pages

1. Descomprimeix el ZIP.
2. Puja tots els fitxers al repositori.
3. Ves a `Settings > Pages`.
4. Tria `Deploy from a branch`.
5. Selecciona `main` i `/root`.
6. Obre la web amb `?v=8` per evitar memòria cau antiga:

```text
https://el-teu-usuari.github.io/DocentCat/?v=8
```

## Fitxers importants

- `index.html`: estructura del panell i finestres.
- `styles.css`: disseny responsive i botons quadrats.
- `app.js`: generadors i lògica local.
- `curriculum-data.js`: dades curriculars locals.
- `data/curriculum-data.js`: còpia de compatibilitat.
- `service-worker.js`: mode PWA i memòria cau.
- `manifest.webmanifest`: configuració instal·lable.

## Nota curricular

La base curricular inclosa és editable i ampliable. Abans d'usar-la com a referència definitiva, convé contrastar CE, criteris d'avaluació i sabers amb la documentació oficial vigent del Departament d'Educació i amb els acords del centre.
