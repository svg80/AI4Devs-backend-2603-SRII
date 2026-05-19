# Decisiones de Diseño - PUT /candidates/:id/stage

## Resumen del Dominio

### Entidades y Relaciones

```text
Candidate (1) ──── (N) Application ──── (1) Position
                                          │
                                          └── interviewFlowId
                                                  │
                                                  └── (N) InterviewStep
                                                         │
                                                         └── orderIndex
```

### Conceptos Clave

| Entidad | Rol | Campos relevantes |
|---------|-----|-------------------|
| `Candidate` | Persona que aplica | id, firstName, lastName |
| `Application` | Postulación específica | candidateId, positionId, **currentInterviewStep** |
| `Position` | Vacante | id, interviewFlowId, status |
| `InterviewStep` | Paso del proceso | id, interviewFlowId, name, orderIndex |
| `InterviewFlow` | Flujo de entrevista | id, description |
| `Interview` | Entrevista realizada | applicationId, interviewStepId, score |

### currentInterviewStep

- **Qué es**: FK en `Application` que apunta a `InterviewStep`
- **Tipo**: `Int` (no nullable en schema.prisma:133)
- **Significado**: La etapa actual del candidato en el proceso de selección
- **Constraints**: Debe ser un `id` válido existente en `InterviewStep`

---

## Decisión 1: Identificación de la Aplicación

### Problema

El endpoint es `PUT /candidates/:id/stage` donde `:id` es el `candidateId`. Pero **un candidato puede tener múltiples aplicaciones** (a diferentes posiciones). ¿Cómo identificamos qué aplicación actualizar?

### Evidencia del Código

**Application.ts:6-12** - Un candidato tiene múltiples aplicaciones:
```typescript
export class Application {
    positionId: number;
    candidateId: number;
    currentInterviewStep: number;
    // ...
}
```

**Candidate.ts:27** - Relación uno a muchos:
```typescript
applications: Application[];
```

**Schema** - No hay constraint único en `(candidateId, positionId)`:
```prisma
model Application {
  candidateId Int
  positionId Int
  // Sin @@unique([candidateId, positionId])
}
```

### Análisis: applicationId vs positionId en el body

| Opción | Campo en Body | Ventajas | Desventajas |
|--------|---------------|----------|-------------|
| **A** | `applicationId` | Directo, sin ambigüedad | Requiere que el cliente sepa el ID |
| **B** | `positionId` | Más fácil de obtener (el cliente conoce las posiciones) | Puede haber múltiples aplicaciones a la misma posición |

### Justificación de la Elección: applicationId

**Elección: applicationId**

**Razones:**
1. **Exactitud**: `applicationId` identifica sin ambigüedad una aplicación específica. Un candidato puede tener varias aplicaciones, incluso a la misma posición (re-aplicaciones).

2. **Consistencia con relaciones del schema**:
   - `Application` tiene `candidateId` + `positionId`
   - La FK `currentInterviewStep` está en `Application`, no en `Position`
   - Para actualizar el paso, necesitamos la `Application` específica

3. **Evita código adicional**:
   - Con `positionId`: `SELECT * FROM Application WHERE candidateId = ? AND positionId = ? LIMIT 1`
   - Con `applicationId`: `SELECT * FROM Application WHERE id = ?` (directo)

4. **Referencia del código existente**: En `Candidate.ts:136`, el include de applications usa la relación completa, y cada Application tiene su propio `id`.

### Solución Adoptada

```http
PUT /candidates/:candidateId/stage
Body: { "applicationId": number, "newStepId": number, "notes"?: string }
```

**Justificación:**
- La URL usa `:candidateId` (del recurso principal Candidates)
- El body incluye `applicationId` para identificar específicamente qué aplicación mover
- Es consistente con la semántica REST: el candidato es el recurso padre
- El cliente puede obtener `applicationId` consultando `/candidates/:id` (que ya retorna aplicaciones)

---

## Decisión 2: Validación del Nuevo Step

### Problema

¿Se permite mover a cualquier etapa o solo secuencialmente (ordenIndex)? ¿Qué validaciones son necesarias?

### Evidencia del Código

**InterviewStep** tiene `orderIndex` que define el orden:
```prisma
model InterviewStep {
  id              Int
  orderIndex      Int
  interviewFlowId Int  // FK al flujo
}
```

**Position** tiene `interviewFlowId`:
```prisma
model Position {
  interviewFlowId Int
  // FK a InterviewFlow
}
```

**Validación necesaria:**
1. El `newStepId` debe existir en `InterviewStep`
2. El `newStepId` debe pertenecer al `interviewFlowId` de la posición
3. Opcional: ¿Restringir a siguiente paso nomás?

### Opciones Consideradas

| Opción | Comportamiento | Uso |
|--------|---------------|-----|
| A | Cualquier paso del flujo | Pruebas, omisión |
| B | Solo siguiente paso (orderIndex + 1) | Flujo lineal obligatorio |
| C | Paso igual o siguiente | Permite estancamiento |

### Solución Adoptada: Opción A (Validación Flexible)

```typescript
// Validar que el step existe
const stepExists = await prisma.interviewStep.findUnique({
    where: { id: newStepId }
});

// Validar que pertenece al flujo de la posición
if (stepExists.interviewFlowId !== position.interviewFlowId) {
    throw new Error('Step does not belong to position interview flow');
}
```

**Justificación:**
- Permite flexibilidad en flujos no lineales
- Un recruiter puede necesitar mover atrás (rechazo) o adelante
- El schema no indica que sea secuencial obligatorio
- Validación de pertenencia al flujo previene estados inválidos

---

## Decisión 3: Validaciones de Negocio

### Problema

¿Qué validaciones adicionales son necesarias?

### Evidencia del Código

**Position tiene status** (schema.prisma:110):
```prisma
status String @default("Draft")
```

**InterviewStep FK es obligatoria** (schema.prisma:133):
```prisma
currentInterviewStep Int  // No nullable
```

### Validaciones Requeridas

| Validación | Razón | Código |
|------------|-------|--------|
| **applicationId existe** | La aplicación debe existir | `findUnique` |
| **Application.candidateId == :candidateId** | Seguridad - la aplicación pertenece al candidato | Comparar IDs |
| Position.status != "Closed" | No modificar cerradas | Check status |
| newStepId existe | FK reference | `findUnique` |
| newStepId.interviewFlowId == position.interviewFlowId | Integridad | Comparar flows |

### Flujo de Validación

```text
1. Parsear applicationId del body
2. applicationId existe? → 404 si no
3. application.candidateId == :candidateId? → 403 si no
4. position.status != "Closed"? → 400 si está cerrada
5. newStepId existe? → 404 si no
6. newStepId.interviewFlowId == position.interviewFlowId? → 400 si no
7. Actualizar currentInterviewStep
```

---

## Decisión 4: Respuesta del Endpoint

### Problema

¿Qué devuelve el endpoint después de actualizar?

### Opciones Consideradas

| Opción | Respuesta | Ventaja |
|--------|-----------|---------|
| A | 204 No Content | Ligero |
| B | 200 con Application actualizada | Informativo |
| C | 200 con candidato + etapa | Contexto completo |

### Solución Adoptada: Opción B

```json
// 200 OK
{
  "applicationId": 1,
  "candidateId": 1,
  "positionId": 1,
  "currentInterviewStep": 2,
  "stepName": "Entrevista HR",
  "stepOrder": 2,
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Justificación:**
- 204 no permite feedback al usuario
- Devolver aplicación completa incluye datos innecesarios
- Lo mínimo útil: qué se actualizó y el nuevo estado

---

## Decisión 5: Notas Opcionales

### Problema

¿Se debe permitir añadir notas al cambiar de etapa?

### Evidencia del Código

**Application tiene campo notes**:
```prisma
notes String?
```

### Solución Adoptada: Sí, notas opcionales

```json
// Request
{
  "applicationId": 1,
  "newStepId": 2,
  "notes": "Candidato pasó a segunda fase"
}

// Response incluye notas si se proporcionaron
{
  "applicationId": 1,
  "candidateId": 1,
  "currentInterviewStep": 2,
  "notes": "Candidato pasó a segunda fase"
}
```

**Justificación:**
- Útil para tracking de decisiones
- El campo ya existe en el schema
- Consistente con otros endpoints del proyecto

---

## Decisión 6: Errores y HTTP Status

### Tabla de Errores

| Escenario | HTTP Status | Mensaje |
|-----------|-------------|---------|
| candidateId no existe | 404 | "Candidate not found" |
| applicationId no existe | 404 | "Application not found" |
| Application no pertenece al candidato | 403 | "Application does not belong to candidate" |
| Position cerrada | 400 | "Cannot update stage for closed position" |
| newStepId no existe | 404 | "Interview step not found" |
| Step no pertenece al flujo | 400 | "Interview step does not belong to position interview flow" |
| Error DB | 500 | "Internal Server Error" |

### Manejo de Errores en el Código

```typescript
// Basado en Candidate.ts:100-109
try {
    return await prisma.application.update({...});
} catch (error: any) {
    if (error.code === 'P2025') {
        throw new Error('Application not found');  // No debería pasar si validamos antes
    }
    throw error;
}
```

---

## Resumen de Decisiones

| Decisión | Solución |
|----------|----------|
| URL | `PUT /candidates/:candidateId/stage` |
| Identificación aplicación | `applicationId` en el body (más preciso que positionId) |
| Validación step | newStepId existe + pertenece al interviewFlow de la posición |
| Validaciones negocio | applicationId existe, Application.candidateId == candidateId, Position abierta |
| Respuesta | 200 con Application actualizada |
| Notas | Opcionales en request |
| Errores | 404/403/400/500 según corresponda |

---

## Contrato Final

### Request

```http
PUT /candidates/:candidateId/stage
Content-Type: application/json

{
  "applicationId": 1,
  "newStepId": 2,
  "notes": "Opcional"
}
```

### Response Exitoso (200)

```json
{
  "applicationId": 1,
  "candidateId": 1,
  "positionId": 1,
  "positionTitle": "Senior Developer",
  "previousStepId": 1,
  "previousStepName": "Aplicación Recibida",
  "currentInterviewStep": 2,
  "stepName": "Entrevista HR",
  "stepOrder": 2,
  "notes": "Notas opcionales",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Response de Error

```json
{
  "error": "Interview step does not belong to position interview flow",
  "message": "The specified interview step is not part of the hiring process for this position"
}
```

---

## Siguiente Paso

Con estas decisiones, proceder a implementar:
1. Service: `updateCandidateStage(candidateId, applicationId, newStepId, notes?)`
2. Controller: validación de applicationId, manejo de errores
3. Route: `PUT /candidates/:candidateId/stage`
4. Tests unitarios e integración

---

## Referencias del Código

- **Application model**: `backend/prisma/schema.prisma:128-139`
- **CurrentInterviewStep FK**: `backend/prisma/schema.prisma:133`
- **InterviewStep con orderIndex**: `backend/prisma/schema.prisma:92-102`
- **Position con interviewFlowId**: `backend/prisma/schema.prisma:104-126`
- **Candidate con aplicaciones**: `backend/src/domain/models/Candidate.ts:27`
- **Patrón de queries Prisma**: `backend/src/domain/models/Candidate.ts:129-162`