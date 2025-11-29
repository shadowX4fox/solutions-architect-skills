# Gestión de Riesgos

**Proyecto**: [PROJECT_NAME]
**Fecha de Generación**: [GENERATION_DATE]
**Fuente**: ARCHITECTURE.md (Secciones 9, 10, 11, 12)
**Versión**: 1.0

---

## Control del Documento

| Campo | Valor |
|-------|-------|
| Propietario del Documento | [PLACEHOLDER: Asignar propietario] |
| Fecha de Revisión | [GENERATION_DATE + 90 days] |
| Estado | Borrador - Generado Automáticamente |

---

[PLACEHOLDER: Usuario debe proporcionar formato organizacional personalizado para Gestión de Riesgos]

---

## Registro de Riesgos (Ejemplo de Estructura)

### RIESGO-001: [Título del Riesgo]
**Categoría**: [Seguridad/Disponibilidad/Rendimiento/Operacional]
**Descripción**: [EXTRACTED or INFERRED from Sections 9, 10, 11, 12]
**Probabilidad**: [1-5]
**Impacto**: [1-5]
**Puntuación de Riesgo**: [Probabilidad × Impacto]
**Fuente**: [SOURCE_REFERENCE]

**Estrategias de Mitigación**:
1. [EXTRACTED or INFERRED]
2. [...]

**Riesgo Residual**: [1-5]
**Propietario**: [PLACEHOLDER: Asignar propietario]
**Fecha Objetivo**: [PLACEHOLDER]

---

### Ejemplos de Riesgos Comunes a Extraer:

**De Sección 9 (Seguridad)**:
- Riesgos de rotación manual de llaves
- Riesgos de autenticación débil
- Vulnerabilidades de exposición de APIs

**De Sección 10 (Rendimiento)**:
- Riesgos de capacidad insuficiente
- Riesgos de violación de SLA
- Riesgos de latencia

**De Sección 11 (Operacional)**:
- Riesgos de DR de región única
- Riesgos de falla de backup
- Riesgos de gestión de incidentes

**De Sección 12 (ADRs)**:
- Riesgos de decisiones arquitectónicas
- Trade-offs y compromisos
- Deuda técnica

---

## Resumen de Riesgos

| Riesgo ID | Categoría | Puntuación | Estado | Propietario |
|-----------|-----------|-----------|--------|-------------|
| [EXTRACTED] | [CATEGORY] | [SCORE] | [STATUS] | [OWNER] |

---

## Apéndice: Trazabilidad de Fuentes

**Datos Extraídos de**: [SOURCE_REFERENCES]
**Última Generación**: [GENERATION_DATE]

**Nota**: Este template es un ejemplo. El usuario debe proporcionar el formato organizacional específico para Gestión de Riesgos.