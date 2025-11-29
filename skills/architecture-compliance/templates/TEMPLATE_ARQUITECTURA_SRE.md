# Contrato de Adherencia: Arquitectura SRE (Site Reliability Engineering)

**Proyecto**: [PROJECT_NAME]
**Fecha de Generación**: [GENERATION_DATE]
**Fuente**: ARCHITECTURE.md (Secciones 10, 11)
**Versión**: 1.0

---

## Control del Documento

| Campo | Valor |
|-------|-------|
| Propietario del Documento | [PLACEHOLDER: Asignar propietario] |
| Fecha de Revisión | [GENERATION_DATE + 90 days] |
| Estado | Borrador - Generado Automáticamente |
| Aprobador | [PLACEHOLDER: Asignar aprobador] |
| Última Actualización | [GENERATION_DATE] |

---

## 1. Service Level Objectives (SLOs)

### 1.1 SLO de Disponibilidad
**Objetivo**: [EXTRACTED: Availability SLO from Section 10.2]
**Presupuesto de Error**: [CALCULATED: Error budget from SLA]
**Ventana de Medición**: Mensual
**Método de Medición**: [EXTRACTED or PLACEHOLDER]
**Fuente**: [SOURCE_REFERENCE]

### 1.2 SLOs de Latencia
| Percentil | Objetivo | Método de Medición | Fuente |
|-----------|----------|-------------------|--------|
| p50 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |
| p95 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |
| p99 | [EXTRACTED from Section 10.1] | [METHOD] | [SOURCE_REFERENCE] |

**Umbral de Alerta**: [PLACEHOLDER: Definir umbral de alerta (ej: p95 > 110ms)]

### 1.3 SLOs de Throughput
**Capacidad de Diseño**: [EXTRACTED: Design capacity TPS from Section 10.1]
**Capacidad Pico**: [EXTRACTED: Peak capacity TPS]
**Margen de Capacidad**: [CALCULATED: Peak - Design]
**Fuente**: [SOURCE_REFERENCE]

---

## 2. Service Level Indicators (SLIs)

### 2.1 Indicadores de Disponibilidad
[PLACEHOLDER: Usuario debe proporcionar formato organizacional para SLIs]

**Componentes Monitoreados**:
- [EXTRACTED: List of components from Section 5]

### 2.2 Indicadores de Rendimiento
[PLACEHOLDER: Usuario debe proporcionar formato organizacional]

---

## 3. Presupuesto de Errores

### 3.1 Presupuesto de Error Mensual
**SLA**: [EXTRACTED from Section 10.2]
**Presupuesto de Error**: [CALCULATED: Error budget in minutes/month]
**Cálculo**: (100% - SLA) × 43,200 min = [VALUE] min/mes

### 3.2 Uso del Presupuesto
| Período | Tiempo de Inactividad Permitido | Uso Actual | Restante |
|---------|----------------------------------|------------|----------|
| Este Mes | [CALCULATED] min | [PLACEHOLDER: Agregar de monitoreo] | [PLACEHOLDER] |
| Mes Anterior | [CALCULATED] min | [PLACEHOLDER: Agregar histórico] | [PLACEHOLDER] |

**Política de Presupuesto de Error**: [PLACEHOLDER: Definir política cuando se agota el presupuesto]

---

## 4. Monitoreo y Observabilidad

### 4.1 Stack de Observabilidad
**Recolección de Métricas**: [EXTRACTED: Metrics tool from Section 11.1]
**Visualización**: [EXTRACTED: Visualization tool from Section 11.1]
**Agregación de Logs**: [EXTRACTED: Logging tool from Section 11.1]
**Trazabilidad Distribuida**: [EXTRACTED: Tracing tool from Section 11.1]
**Plataforma de Alertas**: [EXTRACTED: Alerting platform from Section 11.1]
**Fuente**: [SOURCE_REFERENCE]

### 4.2 Métricas Clave Monitoreadas
- Latencia (p50, p95, p99)
- Throughput (requests/sec)
- Tasa de errores (%)
- Disponibilidad (uptime %)
- Utilización de recursos (CPU, memoria, disco)

**Enlaces a Dashboards**: [PLACEHOLDER: Agregar URLs de dashboards de Grafana]

### 4.3 Configuración de Alertas
[PLACEHOLDER: Usuario debe proporcionar configuración de alertas específica]

---

## 5. Gestión de Incidentes

### 5.1 Clasificación de Incidentes
[EXTRACTED from Section 11.2 or PLACEHOLDER]

| Prioridad | Descripción | SLA de Respuesta | Escalamiento |
|-----------|-------------|------------------|--------------|
| P1 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |
| P2 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |
| P3 | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] | [EXTRACTED or PLACEHOLDER] |

**Fuente**: [SOURCE_REFERENCE or "PLACEHOLDER: Agregar a ARCHITECTURE.md Section 11.2"]

### 5.2 Respuesta a Incidentes
**Plataforma de Alertas**: [EXTRACTED from Section 11.1 or 11.2]
**Incident Commander**: [EXTRACTED or PLACEHOLDER: Definir rol de Incident Commander]
**Canal de Comunicación**: [PLACEHOLDER: Agregar canal de Slack o herramienta]

### 5.3 Ruta de Escalamiento
[EXTRACTED from Section 11.2 or PLACEHOLDER]

1. **L1** (0-5 min): [ROLE] realiza triage
2. **L2** (5-15 min): [ROLE] se involucra
3. **L3** (15-30 min): [ROLE] + [ROLE]

### 5.4 Requisitos de Postmortem
**Requerido Para**: [EXTRACTED or PLACEHOLDER: Todos los incidentes P1 y P2]
**Cronograma**: [PLACEHOLDER: Dentro de 48 horas de resolución]
**Distribución**: [PLACEHOLDER: Equipo de ingeniería, stakeholders]
**Plantilla**: [PLACEHOLDER: Enlace a plantilla de postmortem]

---

## 6. Planificación de Capacidad

### 6.1 Capacidad Actual
**Capacidad de Diseño**: [EXTRACTED from Section 10.1]
**Capacidad Pico**: [EXTRACTED from Section 10.1]
**Utilización Actual**: [PLACEHOLDER: Agregar de monitoreo]

### 6.2 Proyecciones de Crecimiento
[PLACEHOLDER: Usuario debe proporcionar proyecciones de crecimiento]

### 6.3 Umbrales de Escalamiento
[PLACEHOLDER: Definir umbrales de auto-escalamiento]

---

## 7. Gestión de On-Call

### 7.1 Rotación de On-Call
**Esquema de Rotación**: [PLACEHOLDER: Definir esquema (ej: 7 días, 24/7)]
**Cobertura**: [PLACEHOLDER: Primario + Secundario]
**Calendario**: [PLACEHOLDER: Enlace a calendario de on-call]

### 7.2 Contactos del Equipo de Respuesta
[PLACEHOLDER: Agregar contactos del equipo de respuesta a incidentes]

### 7.3 Runbooks Operacionales
**Repositorio**: [PLACEHOLDER: Ubicación del repositorio de runbooks]
**Runbooks Requeridos**:
- Despliegue
- Rollback
- Respuesta a incidentes
- [PLACEHOLDER: Otros runbooks específicos]

---

## 8. Lineamientos de Arquitectura SRE

### 8.1 Evaluación de Resiliencia
[PLACEHOLDER: Usuario debe proporcionar lineamientos organizacionales específicos]

**Lineamientos Clave**:
- Evaluación de resiliencia de componentes
- Observabilidad de componentes críticos
- Capacidad de auto-recuperación
- [PLACEHOLDER: Otros lineamientos organizacionales]

### 8.2 Cumplimiento
**Estado de Cumplimiento**: [PLACEHOLDER: Evaluar cumplimiento]
**Excepciones**: [PLACEHOLDER: Documentar excepciones]
**Plan de Remediación**: [PLACEHOLDER: Si aplica]

---

## Apéndice: Trazabilidad de Fuentes

### Fuentes de Datos

Datos extraídos de ARCHITECTURE.md:

**Sección 10: Requisitos de Rendimiento**
- [SOURCE_REFERENCE]: [DESCRIPTION of extracted data]

**Sección 11: Consideraciones Operacionales**
- [SOURCE_REFERENCE]: [DESCRIPTION of extracted data]

### Datos Faltantes

Los siguientes datos requieren revisión manual (marcados con [PLACEHOLDER]):

1. [LIST of placeholder items from generation]
2. [...]

### Recomendaciones para ARCHITECTURE.md

Para reducir placeholders en futuras generaciones, agregar a ARCHITECTURE.md:

1. **Sección 11.2: Gestión de Incidentes**
   - Contactos del equipo de on-call
   - Esquema de rotación
   - Procedimientos de escalamiento

2. **Sección 11.4: Runbooks Operacionales**
   - Ubicación del repositorio de runbooks
   - Lista de runbooks clave

---

**Última Generación**: [GENERATION_DATE]
**Completitud**: [PERCENTAGE]% ([FILLED]/[TOTAL] puntos de datos)
**Acción Requerida**: Revisar y completar [COUNT] secciones marcadas con [PLACEHOLDER]