# DocentCat PWA

PWA estàtica per a docents de secundària a Catalunya.

## Novetats d'aquesta versió

- Desplegable d'etapa, curs i matèria.
- Desplegables múltiples de competències específiques, criteris d'avaluació i sabers.
- Plantilles útils reutilitzables.
- Importació de currículum propi en JSON.
- Generació de SA, sessions, fitxes, rúbriques, feedback i plantilles.
- Funcionament offline amb Service Worker.
- Sense backend i preparada per GitHub Pages.

## Publicació amb GitHub Pages

1. Crea un repositori a GitHub, per exemple `docentcat-pwa`.
2. Puja tots els fitxers d'aquest ZIP a l'arrel del repositori.
3. Ves a **Settings > Pages**.
4. A **Source**, tria **Deploy from a branch**.
5. Selecciona la branca `main` i la carpeta `/root`.
6. Desa.

La URL serà semblant a:

```text
https://el-teu-usuari.github.io/docentcat-pwa/
```

## Prova local

```bash
python3 -m http.server 8080
```

Obre:

```text
http://localhost:8080
```

## Editar o completar el currículum

La base inicial és a:

```text
data/curriculum-data.js
```

Estructura:

```js
window.DOCENTCAT_CURRICULUM = {
  "ESO": {
    "1r ESO": {
      "Matemàtiques": {
        ce: ["..."],
        ca: ["..."],
        sabers: ["..."]
      }
    }
  }
};
```

També pots importar currículum propi des de la mateixa PWA amb JSON:

```json
{
  "ESO": {
    "1r ESO": {
      "Nova matèria": {
        "ce": ["CE1..."],
        "ca": ["CA1.1..."],
        "sabers": ["Saber 1..."]
      }
    }
  }
}
```

## Avís important

Aquesta versió inclou una base curricular inicial editable per fer la PWA funcional. No substitueix la documentació oficial ni la programació del centre. Cal revisar i completar competències, criteris i sabers amb les fonts oficials vigents i amb els acords del departament didàctic.


## Versió ampliada sense dependència de carpeta `data`

Aquesta versió carrega `curriculum-data.js` des de l'arrel del repositori, cosa que facilita pujar-la des del mòbil. També es manté una còpia dins `data/` per compatibilitat.

La base curricular és editable i ampliada, però no substitueix la consulta del currículum oficial vigent.
