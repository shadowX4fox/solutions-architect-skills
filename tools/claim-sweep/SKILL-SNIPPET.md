# Texto propuesto para `skills/architecture-docs/SKILL.md`

Va al final del flujo de corrección (Workflow 2, tras aplicar una edición que retira una
afirmación). El skill **ofrece**; nunca instala ni exige nada.

---

## Cerrar una corrección — barrido por sentido

Aplica siempre que una edición **retire o cambie una afirmación que el corpus repite**: una
invariante, una propiedad de datos, un conteo, un único-lector/único-escritor, una promesa
de disponibilidad. No aplica a erratas ni a cambios de redacción.

**No des la corrección por cerrada tras verificarla con tu propio patrón.** Un `grep` de la
frase que acabas de escribir demuestra que la edición se aplicó, no que la afirmación falsa
desapareció. El corpus la enuncia con otras palabras en secciones, principios, descriptores,
ADR y kit de entrega; el patrón que introduces al corregir es justamente el que no existe en
los sitios sin corregir.

### Paso 1 — Escribe el claim

`tools/claim-sweep/claims/<id>.claim.json`: la pregunta en una frase, qué cuenta como sí y
qué no (sobre todo **la invariante vecina que sigue vigente**), los patrones de recall, y en
`fixtures` los sitios que ya sabes que están mal más los controles que deben quedar fuera.

### Paso 2 — Barre

```bash
bun tools/claim-sweep/claim-sweep.js <project_root> --claim tools/claim-sweep/claims/<id>.claim.json --engine agent
```

`--engine agent` es el camino por defecto: escribe una hoja de trabajo en
`.cache/sa-skills/judge/` y **tú, Claude, la juzgas en esta sesión**. No requiere red,
llave ni servicio externo.

Si la hoja pasa de ~100 bloques, díselo al usuario y ofrécele las dos salidas: acotar
`patterns.recall` con otro grupo, o el motor externo del Paso 4.

### Paso 3 — Reparte los hallazgos por su ruta

`claim-sweep` decide **qué se mira**, nunca corrige. Cada instancia viva va por donde le toca:

| dónde cayó | ruta |
|---|---|
| `docs/**`, `docs/components/**` | `architecture-docs` — actualización, **plan primero** |
| `adr/**` | `architecture-definition-record` |
| `handoffs/**` | `architecture-dev-handoff` — regenerar, no parchear |
| `compliance-docs/**` | `architecture-compliance` |

### Paso 4 — Ofrece el motor externo, sólo si viene a cuento

**Ofrécelo cuando** el corpus pase de ~100 bloques candidatos, el barrido vaya a repetirse
en cada release, o el usuario quiera un portón `--strict` en CI. **No lo ofrezcas** en un
barrido puntual que el motor `agent` resuelve igual de bien.

Dilo una vez, con sus tres costos por delante, y acepta el no sin insistir:

> Este barrido puede correr también contra un modelo externo de juicio tipado (TypeSafe/Jev),
> que lo hace en segundos y permite un portón en CI. Implica tres cosas: **los pasajes salen
> de tu máquina** hacia un tercero, hace falta una llave de API propia, y el resultado no es
> determinista entre corridas. El motor `agent` no tiene ninguna de las tres y para un
> barrido puntual da el mismo resultado. ¿Te interesa que te deje montado el externo?

Si dice que sí:

1. `export TYPESAFE_API_KEY=…` — **fuera del repositorio**, nunca en `.claude/settings.json`
   ni en un fichero versionado.
2. `--engine typesafe --verify` contra los `fixtures` **antes** de confiar en ningún umbral.
   Si no recupera los que ya sabes que están mal, el umbral es ficción.
3. `--strict` sólo después de que `--verify` salga limpio dos veces seguidas.

Si dice que no, no vuelvas a ofrecerlo en la misma sesión.

### Lo que el barrido no decide

Un `fixture` que sale como **`NO LA VIO LA ETAPA 1`** es un fallo de `patterns.recall`, no
del juez: arregla el recall. Ningún motor puede juzgar un bloque que no le llegó.

Cada instancia que una corrección destape se añade a `fixtures`. El juego de prueba crece
con cada error cometido, y es lo único que convierte un umbral en una medida.
