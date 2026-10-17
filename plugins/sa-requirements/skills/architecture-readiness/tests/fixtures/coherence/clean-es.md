# Especificación del Product Owner: Agenda de Citas

## 1. Contexto de Negocio <!-- SECTION: Business Context -->

### Declaración del Problema <!-- SECTION: Problem Statement -->

Los pacientes de la clínica solo pueden reservar citas por teléfono, de 8:00 a 17:00. El 20% de los pacientes no asiste a su cita y la recepción atiende 300 llamadas diarias. Agenda de Citas permite a los pacientes reservar y cancelar sus citas en autoservicio desde la web y les envía un recordatorio por SMS.

## 3. Objetivos de Negocio <!-- SECTION: Business Objectives -->

### Objetivos Principales <!-- SECTION: Primary Business Goals -->

1. Reducir las inasistencias del 20% al 8% antes de diciembre de 2027.
2. Reducir las llamadas diarias a recepción de 300 a 120 antes de diciembre de 2027.

## 4. Casos de Uso <!-- SECTION: Use Cases -->

### UC-01: Reservar una cita

**Descripción**: El paciente reserva una cita en la web sin llamar a la clínica.

**Actores**: Paciente

**Disparador**: El paciente selecciona Reservar cita en la web de la clínica.

**Flujo principal**:
1. El paciente elige la especialidad: Medicina General, Pediatría o Dermatología.
2. El sistema muestra los horarios libres de los próximos 30 días —los horarios de la agenda de la especialidad sin una cita Reservada—, cada uno con el nombre del médico que la agenda asigna a ese horario.
3. El paciente elige un horario e ingresa su número de cédula y su teléfono móvil; la cita queda registrada a nombre de esa cédula con ese teléfono.
4. El sistema confirma la cita y envía un SMS con la fecha, la hora y el médico del horario elegido.

**Postcondiciones**: La cita queda en estado Reservada y el horario deja de mostrarse como libre.

**Criterios de aceptación**:
- Un paciente reserva una cita en menos de 3 minutos sin intervención de recepción.

### UC-02: Recordar la cita

**Descripción**: El sistema recuerda la cita al paciente para reducir las inasistencias.

**Actores**: Agenda de Citas, Paciente

**Disparador**: Faltan 24 horas para una cita en estado Reservada.

**Flujo principal**:
1. El sistema envía un SMS al teléfono móvil del paciente con la fecha, la hora y un enlace para cancelar.

**Postcondiciones**: La cita registra la fecha y la hora de envío del SMS.

**Criterios de aceptación**:
- Toda cita Reservada recibe su SMS entre 24 y 23 horas antes de la hora de la cita.

### UC-03: Cancelar una cita

**Descripción**: El paciente cancela su cita en autoservicio.

**Actores**: Paciente

**Disparador**: El paciente abre el enlace de cancelación del SMS de recordatorio, que lleva a esa cita.

**Flujo principal**:
1. El sistema muestra la cita y el botón Cancelar.
2. El paciente confirma la cancelación.

**Flujos alternativos**:
- Si faltan menos de 2 horas para la cita, el sistema no permite cancelar y muestra "Llame a la clínica para cancelar".

**Postcondiciones**: La cita queda en estado Cancelada y el horario vuelve a mostrarse como libre.

**Criterios de aceptación**:
- Un horario cancelado aparece como libre en menos de 1 minuto.

### UC-04: Consultar la agenda del día

**Descripción**: La recepcionista consulta las citas del día.

**Actores**: Recepcionista

**Disparador**: La recepcionista abre la Agenda del día.

**Flujo principal**:
1. El sistema muestra las citas del día por médico y hora, con su estado: Reservada o Cancelada.

**Postcondiciones**: La recepcionista ve todas las citas del día.

**Criterios de aceptación**:
- La agenda muestra las citas reservadas hasta un minuto antes de abrirla.

### Fuera de Alcance <!-- SECTION: Out of Scope -->

- El pago de las consultas en línea.

## 7. Restricciones de Negocio <!-- SECTION: Business Constraints -->

### Restricciones Tecnológicas <!-- SECTION: Technology Constraints -->

- Agenda de Citas se usa desde el navegador web; no se instala ninguna aplicación.
- La agenda del día se consulta desde los computadores de recepción.

## 8. Métricas de Éxito y KPIs <!-- SECTION: Success Metrics and KPIs -->

### KPIs de Negocio <!-- SECTION: Business KPIs -->

| KPI | Línea base | Meta |
|---|---|---|
| Inasistencias | 20% | 8% |
| Llamadas diarias a recepción | 300 | 120 |
