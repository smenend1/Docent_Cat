# DocentCat PWA v12.3 · Exportacions clares

Versió per GitHub Pages amb panell compacte, currículum STEM i un banc local d’exercicis per matèria, curs i tema curricular.

## Novetats v12.3

- Nou fitxer `exercise-bank.js` amb 89 temes STEM i 356 exercicis tipus originals.
- Matèries cobertes: Matemàtiques, Matemàtiques A, Matemàtiques B, Tecnologia i Digitalització, Tecnologia, Digitalització, Biologia i Geologia, Física i Química.
- La generació de fitxes prioritza el banc d’exercicis quan el curs, la matèria, els sabers o la consigna coincideixen amb un tema.
- Si la consigna demana blocs concrets, es mantenen els generadors específics existents.
- Panell Exportar / importar més clar: exportació de SA, sessions, fitxes, rúbriques, feedback, plantilles o tot el projecte.
- Exportació directa de la SA en HTML, Word i impressió/PDF.
- Exportació/importació de projecte JSON visible i explicada.
- Selector d’exercicis STEM mantingut.

## Fitxers importants

- `curriculum-data.js`: CE, CA i sabers.
- `exercise-bank.js`: banc d’exercicis STEM.
- `app.js`: motor de generació i exportació.

## Nota de qualitat

El banc és una base local extensa, però no és una transcripció oficial d’activitats del Departament. Els exercicis són originals i s’han d’adaptar al grup, al temps disponible i al criteri docent.

## Publicació

Puja tots els fitxers a GitHub Pages i obre la web amb:

```text
https://smenend1.github.io/DocentCat/?v=12.2
```


## v12.3

Corregeix la importació de projectes JSON: ara el fitxer importat s’aplica directament als menús, a les seleccions curriculars i a les sortides generades, i també es desa al navegador.
