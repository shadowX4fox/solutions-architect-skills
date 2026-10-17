# claim-sweep — barrer una afirmación por su sentido

Cuando una corrección retira una afirmación que el corpus repite, verificarla con el patrón
que uno acaba de escribir sólo demuestra que **la edición se aplicó**. No demuestra que la
afirmación falsa desapareció: el corpus enuncia la misma invariante con otras palabras en
secciones, principios, descriptores, ADR y kit de entrega, y el patrón que introduces al
corregir es, por construcción, el que ya no existe en los sitios sin corregir.

Esta herramienta hace el segundo barrido: el que busca por sentido.

## Las tres etapas

| | qué hace | dónde vive |
|---|---|---|
| **1 · Recall** | Corta el corpus en **bloques** —párrafo, ítem de lista, fila de tabla **con su cabecera**— y se queda con los que casan todos los grupos de `patterns.recall`. Ruidoso a propósito. | código |
| **2 · Juicio** | Un veredicto por bloque. Aquí es donde eliges motor. Lo que el juez no respondió queda **sin decidir**. | `agent` · `typesafe` · `clef` |
| **3 · Política** | Umbrales, bandas y salida. **Nunca** vive en el juez. | código |

El corte por bloque no es un detalle. Una afirmación puede repartirse entre la cabecera de
una tabla y su celda —`| … | Escritor único | Lector |` más `| … | ningún lector externo |`—
y un barrido por línea no la ve jamás, por bueno que sea el juez de la Etapa 2.

## Los tres motores

La Etapa 2 es `scripts/judge.js`, el juez compartido del plugin: una spec (pregunta, criterios,
cortes) y una lista de ítems entran, una respuesta tipada por ítem sale, y cada respuesta dice
qué motor la dio. Este script sólo aporta el recall y la política. Cualquier otro barrido por
sentido del plugin usa el mismo juez con otra spec.

El motor es `--engine`, si no `SA_JUDGE`, si no `agent`. No hay motor de reserva: el antiguo
`heuristic` —que ordenaba por rasgos y no distinguía «lo afirma» de «lo niega»— se retiró en
8.119.0. Un bloque que el juez no respondió queda **SIN DECIDIR**: ni instancia viva ni
descartado, listado aparte con la hoja donde se responde; y `--strict` sale con 5 mientras
quede alguno, porque un portón no se abre sobre lo que nadie juzgó.

### `--engine agent` (por defecto)

El juez es Claude, en la sesión que ya tienes abierta. Escribe una hoja de trabajo en
`.cache/sa-skills/judge/<id>.worksheet.md` con la pregunta, los criterios y cada
bloque, y se la pasas al modelo. Ni red, ni llave, ni coste aparte. Hasta que la respondas,
todos los bloques están sin decidir; con `--verify` ya dice si la Etapa 1 ve cada fixture.

Es el motor por defecto para quien no quiera un servicio externo. Su límite es el volumen:
a partir de unos cien bloques la hoja se vuelve larga para juzgarla de una sentada.

### `--engine typesafe` (opt-in)

Un `Noul` por bloque contra el modelo Jev de TypeSafe, batcheados. Exige `TYPESAFE_API_KEY`
y saca los datos de tu máquina — es una decisión deliberada, nunca el camino por defecto.

Rinde para corpus grandes: 134 bloques en 7 peticiones y ~2,8 s.

### `--engine clef` (opt-in)

Clef de Cloudflare en Workers AI (`@cf/cloudflare/clef`): el mismo protocolo, lote y caché que
`typesafe`, con `CLOUDFLARE_ACCOUNT_ID` y `CLOUDFLARE_API_TOKEN` en el entorno
(`CLOUDFLARE_AI_GATEWAY_ID` lo enruta por un AI Gateway). Sus bandas se midieron con Jev: mide
el corte con `--verify` antes de fiarte de él.

## El fichero de claim

Declarativo, versionable, uno por afirmación que hayas corregido:

```jsonc
{
  "id": "registro-lector-unico",
  "question": "¿Este pasaje afirma, como estado vigente, que <sujeto> es el ÚNICO lector de <objeto>?",
  "criteria": {
    "true":  "Qué cuenta como sí, con las redacciones que hayas visto.",
    "false": "Qué NO cuenta: la invariante vecina que sigue vigente, las correcciones, otros componentes."
  },
  "patterns": {
    "recall":     [["escritor","lector"], ["colecci[oó]n del registro","registro de estados?"]]
  },
  "fixtures": [ { "file": "…", "line": 127, "label": 1, "nota": "por qué" } ]
}
```

`recall` es **Y-de-O**: cada grupo debe casar. Un solo grupo trae medio corpus — con un
grupo, 1074 bloques; con dos, 134.

`criteria.false` es lo que más trabajo ahorra. La discriminación difícil casi nunca es
«¿habla del tema?» sino «¿afirma *esta* invariante o la de al lado?».

## `--verify`, y por qué es obligatorio antes de confiar

`fixtures` es tu juego de prueba: los sitios que ya sabes que están mal, y los controles que
deben quedar fuera. `--verify` mide el motor contra ellos.

Distingue dos fracasos que se arreglan en sitios distintos:

- **por debajo del corte** — el juez falló. Baja el umbral o afina `criteria`.
- **sin decidir** — el juez aún no respondió ese bloque. Responde la hoja y vuelve a correr.
- **`NO LA VIO LA ETAPA 1`** — el recall falló. **Arregla `patterns.recall`, no el juez.**
  Ningún modelo puede juzgar un bloque que no le llegó.

Cuando una corrección destape una instancia nueva, añádela a `fixtures`. El juego crece con
cada error cometido, que es lo que lo hace valer.

## Lo que esto no hace

No corrige nada. Decide **qué se mira**. Las correcciones siguen su ruta de siempre:
`architecture-docs` para secciones y descriptores, `architecture-definition-record` para
ADR, `architecture-dev-handoff` para regenerar el kit.

Tampoco es determinista con `--engine typesafe`: entre dos corridas del mismo corpus una
puntuación se movió de 0.86 a 0.83. Por eso la banda de revisión existe y por eso el corte
duro no debería ser tu única red. El juez cachea cada respuesta por contenido en
`.cache/sa-skills/judge/<id>.cache.json`: un bloque que no cambió no vuelve a la API, y una
segunda corrida sobre el mismo corpus reproduce la primera y no cuesta nada.

## Uso

`claims/example-unico-lector.claim.json` es el ejemplo completo — nombres inventados, con el corpus
que `claim-sweep.test.ts` escribe para medirlo (`bun test tools/claim-sweep`). Un claim real nombra
componentes y ficheros de un proyecto: escríbelo junto a él (`.cache/sa-skills/judge/` es un buen
sitio, donde ya viven la caché y los fixtures) o en `claims/`, que está ignorado por git salvo el ejemplo.

```bash
bun tools/claim-sweep/claim-sweep.js . --claim tools/claim-sweep/claims/<id>.claim.json
bun tools/claim-sweep/claim-sweep.js . --claim … --engine agent
bun tools/claim-sweep/claim-sweep.js . --claim … --engine typesafe --verify
bun tools/claim-sweep/claim-sweep.js . --claim … --engine typesafe --strict   # portón: sale 1 si hay instancia viva
```

`--hi` (0.85) · `--lo` (0.40) · `--chunk` (25) · `--dirs` · `--json` · `--no-cache` (vuelve a preguntar; mide la deriva)

El corte y el piso también pueden ir en el claim (`"hi": 0.65`, `"lo": 0.4`), medidos con
`--verify` y anotados junto a su fecha y modelo; la CLI los sobreescribe. Un corte que no se
midió contra los fixtures es una ficción, se escriba donde se escriba.
