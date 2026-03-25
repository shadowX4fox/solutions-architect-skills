##### Drivers de diseño

- **Entrega de valor:** <Cambio efectivo en la experiencia de los clientes.>
    - **Umbral:**
        - Mayor que 50% Impacto Alto
        - Menor que 50% Impacto Bajo
    - **Impacto:**
        - <BAJO/ALTO>
- **Escala:** <Cantidad estimada de clientes impactados por el cambio.>
    - **Umbral:**
        - Mayor que 100K Impacto Alto
        - Menor que 100K Impacto Bajo
    - **Impacto:**
        - <BAJO/ALTO>
- **Impactos:** <Cantidad de impactos en configuración, desarrollo o implementación en las aplicaciones.>
    - **Umbral:**
        - Mayor que 5 Impacto Alto
        - Menor que 5 Impacto Bajo
    - **Impacto:**
        - <BAJO/ALTO>

##### Decisiones de Arquitectura

- **Problema o necesidad:** <Descripción del problema o necesidad que generó la decisión de arquitectura>
    - **Decisión:** <Descripción de la decisión tomada>
        - **Implicaciones técnicas:** <Descripción de las implicaciones técnicas de la decisión>
        - **Otras implicaciones (operativas, negocio, etc):** <Descripción de implicaciones no técnicas>
    - **Alternativas evaluadas:**
        - <Descripción de la alternativa 1>
        - <Descripción de la alternativa N>
    - **Criterios o principios aplicados:**
        - <Descripción del criterio o principio 1>
        - <Descripción del criterio o principio N>
    - **Suposiciones:**
        - <Descripción de la suposición 1>
        - <Descripción de la suposición N>

###### Dimensionamiento de capacidades de los Componentes de la Solución

- **Parámetro:** Cantidad de usuarios (con estimación de los PO, horizonte 6 meses a un año)
    - **Demanda normal:** <Describir la demanda normal de usuarios>
    - **Demanda alta (pico):** <Describir la demanda pico de usuarios, cuántos usuarios se estiman y cuándo>
- **Parámetro:** Transacciones por minuto (horizonte 6 meses a un año)
    - **Demanda normal:** <Describir la demanda normal de transacciones>
    - **Demanda alta (pico):** <Describir la demanda pico de transacciones, cuántas transacciones se estiman y cuándo>
- **Parámetro:** Carga útil transaccional (Payload) (horizonte 6 meses a un año)
    - <Describir el tamaño de la carga útil promedio por transacción en unidades de almacenamiento (bytes)>
- **Parámetro:** Almacenamiento operacional
    - **Mínimo:** <Estimado mínimo en GB de almacenamiento en la base de datos transaccional>
    - **Máximo:** <Estimado máximo en GB de almacenamiento en la base de datos transaccional>
- **Parámetro:** Almacenamiento de respaldo
    - **Mínimo:** <Estimado mínimo en GB de almacenamiento en almacenamiento de respaldo>
    - **Máximo:** <Estimado máximo en GB de almacenamiento en almacenamiento de respaldo>
- **Parámetro:** Almacenamiento analítico
    - **Mínimo:** <Estimado mínimo en GB de almacenamiento en almacenamiento analítico>
    - **Máximo:** <Estimado máximo en GB de almacenamiento en almacenamiento analítico>

###### Description

(aquí van las secciones restantes del apartado Description del componente)

###### Riesgos y Deuda de Arquitectura

- **Deuda de Arquitectura:** <Descripción de la deuda de Arquitectura>
    - **Justificación:** <Descripción de la justificación de la existencia de la deuda>
    - **Riesgo:** <Descripción del riesgo asociado a la deuda>
    - **Fecha aproximada de remediación:** <Fecha aproximada de remediación de la deuda>

##### Contrato de Adherencia - Aprobaciones

- **Área:** Continuidad de Negocio
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura SRE
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura Cloud
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura Datos y Analítica - IA
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura Desarrollo
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Transformación de Procesos y Automatización
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura Seguridad
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Plataformas e Infraestructura TI
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura Empresarial
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>

- **Área:** Arquitectura de Integración
    - **Estado:** <Cumple / No cumple / No aplica>
    - **Observaciones:** <Detalle de observaciones>
