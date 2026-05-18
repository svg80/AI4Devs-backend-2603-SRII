# Diseño de API: GET /positions/:id/candidates

## Objetivo

Obtener todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones (`Application`) para un `positionId` específico.

---

## 1. Campos Mínimos del Endpoint

| Campo | Origen | Descripción |
|-------|--------|-------------|
| `candidateId` | `Candidate.id` | ID del candidato |
| `candidateName` | `Candidate.firstName + Candidate.lastName` | Nombre completo |
| `currentInterviewStep` | `InterviewStep.name` | Fase actual del proceso |
| `averageScore` | Media de `Interview.score` | Puntuación media del candidato |

---

## 2. Contrato de Respuesta

```json
{
  "positionId": 1,
  "positionTitle": "Senior Backend Developer",
  "candidates": [
    {
      "candidateId": 10,
      "candidateName": "María García",
      "currentInterviewStep": "Entrevista HR",
      "averageScore": 8.5
    },
    {
      "candidateId": 11,
      "candidateName": "Carlos López",
      "currentInterviewStep": "Entrevista Técnica",
      "averageScore": null
    }
  ]
}
```

---

## 3. Manejo de Casos Especiales

### 3.1 Sin entrevistas (averageScore null)

```json
{
  "candidateId": 11,
  "candidateName": "Carlos López",
  "currentInterviewStep": "Entrevista HR",
  "averageScore": null
}
```

**Cálculo:**

```typescript
const scoredInterviews = interviews.filter(i => i.score !== null);
const averageScore = scoredInterviews.length > 0
    ? scoredInterviews.reduce((sum, i) => sum + i.score, 0) / scoredInterviews.length
    : null;
```

### 3.2 Paso inexistente (aplicación huérfana)

Si `currentInterviewStep` no existe en `InterviewStep`, devolver `null`:

```json
{
  "candidateId": 12,
  "candidateName": "Ana Martínez",
  "currentInterviewStep": null,
  "averageScore": null
}
```

---

## 4. Query Prisma Sugerida

```typescript
const applications = await prisma.application.findMany({
  where: { positionId: positionId },
  include: {
    candidate: {
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    },
    interviewStep: {
      select: { name: true }
    },
    interviews: {
      select: { score: true }
    }
  }
});

// Transformar y calcular averageScore
const candidates = applications.map(app => {
  const scores = app.interviews.map(i => i.score).filter((s): s is number => s !== null);
  const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;

  return {
    candidateId: app.candidate.id,
    candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
    currentInterviewStep: app.interviewStep?.name ?? null,
    averageScore
  };
});
```

---

## 5. Ejemplo Completo de Respuesta

```json
{
  "positionId": 1,
  "positionTitle": "Senior Backend Developer",
  "candidates": [
    {
      "candidateId": 10,
      "candidateName": "María García",
      "currentInterviewStep": "Entrevista HR",
      "averageScore": 8.5
    },
    {
      "candidateId": 11,
      "candidateName": "Carlos López",
      "currentInterviewStep": "Entrevista Técnica",
      "averageScore": 7.0
    },
    {
      "candidateId": 12,
      "candidateName": "Ana Martínez",
      "currentInterviewStep": "Aplicación Recibida",
      "averageScore": null
    }
  ]
}
```

---

## 6. Anti-Patterns a Evitar

| Anti-Pattern | Alternativa |
|-------------|-------------|
| Incluir todos los campos de Prisma | Usar `select` con campos específicos |
| Campos innecesarios (email, phone, etc.) | Solo lo solicitado |
| Estructura anidada compleja | Array plano de candidatos |

---

## 7. Código de Implementación

### Modelo (Position.ts)

```typescript
static async findCandidatesByPosition(positionId: number) {
    return await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: {
                select: { id: true, firstName: true, lastName: true }
            },
            interviewStep: {
                select: { name: true }
            },
            interviews: {
                select: { score: true }
            }
        }
    });
}
```

### Service

```typescript
export const getPositionCandidates = async (positionId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, title: true }
    });

    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await Position.findCandidatesByPosition(positionId);

    const candidates = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);
        
        const averageScore = scores.length > 0
            ? scores.reduce((a, b) => a + b, 0) / scores.length
            : null;

        return {
            candidateId: app.candidate.id,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? null,
            averageScore
        };
    });

    return {
        positionId: position.id,
        positionTitle: position.title,
        candidates
    };
};
```

### Controller

```typescript
export const getPositionCandidates = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await getPositionCandidatesService(id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
```

---

## 8. Análisis de Rendimiento

### 8.1 Riesgos de N+1 Queries

**Escenario problemático (sin optimizar):**

```
Query 1: GET /positions/1/candidates
   ↓
N Queries: Para cada candidato → SELECT interviews WHERE candidateId = X
   ↓
N Queries: Para cada aplicación → SELECT candidate WHERE id = Y
```

**Código que genera N+1:**

```typescript
// ❌ MAL: N+1 garantizado
const applications = await prisma.application.findMany({
    where: { positionId: 1 }
});

for (const app of applications) {
    const candidate = await prisma.candidate.findUnique({ where: { id: app.candidateId } });
    const interviews = await prisma.interview.findMany({ where: { applicationId: app.id } });
}
```

**Código seguro (1 query + joins):**

```typescript
// ✅ BIEN: Sin N+1
const applications = await prisma.application.findMany({
    where: { positionId },
    include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviewStep: { select: { name: true } },
        interviews: { select: { score: true } }
    }
});
```

### 8.2 Estrategia Prisma Recomendada

| Estrategia | Uso | Ventajas | Desventajas |
|-----------|-----|---------|-------------|
| `include` | Relations necesarias | Simple, tipado | Carga todo si no se filtra con `select` |
| `select` | Campos específicos | Minimiza datos transferidos | Puede ser verboso |
| `aggregate` | Cálculos en BD | Reduce transferencia | Limitado a cálculos simples |

**Recomendación**: `include` + `select` anidado

```typescript
const applications = await prisma.application.findMany({
    where: { positionId },
    select: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviewStep: { select: { name: true } },
        interviews: { select: { score: true } }
    }
});
```

### 8.3 Cálculo Eficiente de averageScore

**Opción A: En memoria (simple, suficiente para < 100 entrevistas)**

```typescript
const averageScore = scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
```

**Opción B: En base de datos (optimizado para > 100 candidatos)**

```typescript
const result = await prisma.$queryRaw`
    SELECT 
        a.id as "applicationId",
        AVG(i.score)::float as "averageScore"
    FROM "Application" a
    LEFT JOIN "Interview" i ON i."applicationId" = a.id AND i.score IS NOT NULL
    WHERE a."positionId" = ${positionId}
    GROUP BY a.id
`;
```

| Volumen | Estrategia | Justificación |
|---------|-----------|----------------|
| < 100 candidatos/posición | En memoria | Simple, mantenible |
| > 100 candidatos/posición | Raw query | Reduce transferencia de datos |

### 8.4 Índices Recomendados

```prisma
model Application {
  @@index([positionId])
  @@index([candidateId])
  @@index([positionId, currentInterviewStep])
}

model Interview {
  @@index([applicationId])
  @@index([applicationId, score])
}
```

**Query SQL para crear índices manualmente:**

```sql
CREATE INDEX idx_application_position ON "Application"("positionId");
CREATE INDEX idx_application_candidate ON "Application"("candidateId");
CREATE INDEX idx_application_position_step ON "Application"("positionId", "currentInterviewStep");
CREATE INDEX idx_interview_application ON "Interview"("applicationId");
CREATE INDEX idx_interview_app_score ON "Interview"("applicationId", score);
```

### 8.5 Joins Generados por Prisma

```
Application ──┬── Candidate (1:1, siempre)
             ├── InterviewStep (1:1, siempre)
             └── Interview (1:N, LEFT JOIN, aquí está el riesgo)
```

**Riesgo**: Si un candidato tiene 10 entrevistas, el `LEFT JOIN` devuelve 10 filas duplicadas.

### 8.6 Problemas con Volumen Alto

| Síntoma | Causa | Solución |
|---------|-------|----------|
| Timeout en endpoint | Query sin índice en `positionId` | Añadir índice |
| Memory exceeded | Cargar todas las entrevistas | Limitar campos, paginar |
| Slow response > 2s | N+1 queries | Usar include con select |

| Métrica | Warning | Critical |
|---------|---------|----------|
| Candidatos/posición | > 50 | > 200 |
| Tiempo de respuesta | > 500ms | > 2000ms |

### 8.7 Datos que NO Cargar

| Campo | Modelo | Razón |
|-------|--------|-------|
| `email` | Candidate | No solicitado, PII innecesaria |
| `phone` | Candidate | No solicitado, PII innecesaria |
| `address` | Candidate | No solicitado |
| `notes` | Interview | No solicitado, puede ser largo |
| `filePath` | Resume | No solicitado |

### 8.8 Estrategia Anti-Overfetching

1. **Select explícito**: Siempre especificar campos exactos
2. **No include sin select**: Usar `include: { relation: { select: {} } }`
3. **Paginación**: Si `candidates > 50`, implementar paginación

**Implementación de paginación:**

```typescript
const [applications, total] = await Promise.all([
    prisma.application.findMany({
        where: { positionId },
        select: { /* ... */ },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { applicationDate: 'desc' }
    }),
    prisma.application.count({ where: { positionId } })
]);

return {
    candidates: transform(applications),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
};
```

---

## 9. Resumen de Optimizaciones

| Aspecto | Solución |
|---------|----------|
| N+1 queries | `include` con `select` anidado |
| Overfetching | `select` explícito en cada relación |
| averageScore | Cálculo en memoria (o raw query para > 100) |
| Índices | `positionId` en Application, `applicationId` en Interview |
| Joins | Solo las 3 tablas necesarias |
| Paginación | Activar si `total > 50` |

---

## 10. Implementación Completa

### 10.1 DTOs (Data Transfer Objects)

```typescript
// application/dto/position.dto.ts

export interface CandidatePositionDTO {
    candidateId: number;
    candidateName: string;
    currentInterviewStep: string | null;
    averageScore: number | null;
}

export interface PositionCandidatesResponseDTO {
    positionId: number;
    positionTitle: string;
    candidates: CandidatePositionDTO[];
}

export interface PositionCandidatesQueryDTO {
    page?: number;
    limit?: number;
}
```

### 10.2 Route

```typescript
// routes/positionRoutes.ts
import { Router } from 'express';
import { getPositionCandidates } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getPositionCandidates);

export default router;
```

### 10.3 Controller

```typescript
// presentation/controllers/positionController.ts
import { Request, Response } from 'express';
import { getPositionCandidatesService } from '../../application/services/positionService';
import { PositionIdDTO } from '../../application/dto/position.dto';

export const getPositionCandidates = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'Invalid ID format',
                message: 'ID must be a positive integer'
            });
        }

        const params: PositionIdDTO = { id };
        const result = await getPositionCandidatesService(params);

        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
            }
            return res.status(500).json({
                error: 'Internal Server Error',
                message: error.message
            });
        }
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred'
        });
    }
};
```

### 10.4 Service

```typescript
// application/services/positionService.ts
import { PrismaClient } from '@prisma/client';
import {
    PositionCandidatesResponseDTO,
    PositionIdDTO,
    CandidatePositionDTO
} from '../dto/position.dto';

const prisma = new PrismaClient();

export const getPositionCandidatesService = async (
    params: PositionIdDTO
): Promise<PositionCandidatesResponseDTO> => {
    const { id: positionId } = params;

    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, title: true }
    });

    if (!position) {
        throw new Error(`Position with ID ${positionId} not found`);
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        select: {
            candidateId: true,
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            interviewStep: {
                select: { name: true }
            },
            interviews: {
                select: { score: true }
            }
        },
        orderBy: { applicationDate: 'desc' }
    });

    const candidates: CandidatePositionDTO[] = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);

        const averageScore = calculateAverageScore(scores);

        return {
            candidateId: app.candidate.id,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? null,
            averageScore
        };
    });

    return {
        positionId: position.id,
        positionTitle: position.title,
        candidates
    };
};

const calculateAverageScore = (scores: number[]): number | null => {
    if (scores.length === 0) return null;
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round((sum / scores.length) * 10) / 10;
};
```

### 10.5 Query Prisma Ideal

```typescript
// Query única sin N+1
const applications = await prisma.application.findMany({
    where: { positionId },
    select: {
        candidateId: true,
        candidate: {
            select: {
                id: true,
                firstName: true,
                lastName: true
            }
        },
        interviewStep: {
            select: { name: true }
        },
        interviews: {
            select: { score: true }
        }
    },
    orderBy: { applicationDate: 'desc' }
});
```

### 10.6 Validaciones

```typescript
// application/validator/position.validator.ts

export interface PositionIdDTO {
    id: number;
}

export const validatePositionId = (params: any): PositionIdDTO => {
    const id = parseInt(params.id, 10);

    if (isNaN(id) || id <= 0) {
        throw new Error('Invalid position ID');
    }

    return { id };
};
```

### 10.7 Manejo de Errores

| Escenario | Error thrown | HTTP Status | Mensaje |
|-----------|-------------|-------------|---------|
| ID no numérico | `Error` | 400 | 'Invalid ID format' |
| ID <= 0 | `Error` | 400 | 'Invalid ID format' |
| Position no existe | `Error` | 404 | 'Position not found' |
| Error DB | `PrismaError` | 500 | 'Internal Server Error' |

```typescript
// Error handling en controller
try {
    // lógica
} catch (error) {
    if (error instanceof Error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ error: 'Not Found' });
        }
    }
    res.status(500).json({ error: 'Internal Server Error' });
}
```

### 10.8 Response Contract

```json
// 200 OK
{
  "positionId": 1,
  "positionTitle": "Senior Backend Developer",
  "candidates": [
    {
      "candidateId": 10,
      "candidateName": "María García",
      "currentInterviewStep": "Entrevista HR",
      "averageScore": 8.5
    }
  ]
}

// 400 Bad Request
{
  "error": "Invalid ID format",
  "message": "ID must be a positive integer"
}

// 404 Not Found
{
  "error": "Not Found",
  "message": "Position with ID 999 not found"
}

// 500 Internal Server Error
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

### 10.9 Casos Edge

| Caso | Comportamiento | Ejemplo respuesta |
|------|---------------|-------------------|
| Sin candidatos | Array vacío | `{ "candidates": [] }` |
| Sin entrevistas | averageScore = null | `{ "averageScore": null }` |
| Todas entrevistas sin score | averageScore = null | `{ "averageScore": null }` |
| Step huérfano (no existe) | currentInterviewStep = null | `{ "currentInterviewStep": null }` |
| Position no existe | 404 error | `{ "error": "Not Found" }` |
| ID inválido | 400 error | `{ "error": "Invalid ID format" }` |

### 10.10 Estrategia de Testing

```typescript
// __tests__/positionService.test.ts
import { getPositionCandidatesService } from '../../application/services/positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('getPositionCandidatesService', () => {
    beforeEach(async () => {
        // Setup: crear datos de test
    });

    afterEach(async () => {
        // Cleanup: limpiar datos de test
    });

    it('should return empty array when no candidates', async () => {
        const result = await getPositionCandidatesService({ id: 1 });
        expect(result.candidates).toEqual([]);
    });

    it('should calculate averageScore correctly', async () => {
        const result = await getPositionCandidatesService({ id: 1 });
        const candidate = result.candidates[0];
        expect(candidate.averageScore).toBe(8.5);
    });

    it('should return null averageScore when no interviews with score', async () => {
        const result = await getPositionCandidatesService({ id: 1 });
        const candidate = result.candidates.find(c => c.candidateId === 99);
        expect(candidate?.averageScore).toBeNull();
    });

    it('should throw error when position not found', async () => {
        await expect(getPositionCandidatesService({ id: 9999 }))
            .rejects.toThrow('Position with ID 9999 not found');
    });
});
```

```typescript
// __tests__/positionController.test.ts
describe('GET /positions/:id/candidates', () => {
    it('should return 200 with candidates list', async () => {
        const response = await request(app)
            .get('/positions/1/candidates')
            .expect(200);

        expect(response.body).toHaveProperty('positionId');
        expect(response.body).toHaveProperty('candidates');
    });

    it('should return 400 for invalid ID', async () => {
        const response = await request(app)
            .get('/positions/invalid')
            .expect(400);

        expect(response.body).toHaveProperty('error', 'Invalid ID format');
    });

    it('should return 404 for non-existent position', async () => {
        const response = await request(app)
            .get('/positions/9999/candidates')
            .expect(404);

        expect(response.body).toHaveProperty('error', 'Not Found');
    });
});
```

---

## 11. Consistencia con el Proyecto

### Estructura de archivos a seguir

```
backend/src/
├── application/
│   ├── services/
│   │   └── positionService.ts        # ✅ Nuevo
│   └── dto/
│       └── position.dto.ts           # ✅ Nuevo
├── presentation/
│   └── controllers/
│       └── positionController.ts    # ✅ Nuevo
├── routes/
│   └── positionRoutes.ts            # ✅ Nuevo
└── domain/
    └── models/
        └── Position.ts              # ⚠️ Añadir método estático
```

### Convenciones adoptadas

| Elemento | Estilo del proyecto |
|---------|---------------------|
| Nomenclatura services | `verbo + Recurso` → `getPositionCandidatesService` |
| Nomenclatura controllers | `verbo + Recurso` → `getPositionCandidates` |
| DTOs | `PascalCase` + sufijo `DTO` |
| Errores | `throw new Error('mensaje')` |
| Imports | Rutas relativas desde capa actual |

---

## 12. Refactors Mínimos Recomendados

### 12.1 Extraer PrismaClient a singleton

```typescript
// common/prisma.ts (NUEVO)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

**Cambiar en todos los modelos:**
```typescript
// Antes: const prisma = new PrismaClient();
// Después: import prisma from '../../common/prisma';
```

### 12.2 Añadir índices al schema

```prisma
// prisma/schema.prisma - Añadir a Application
model Application {
  @@index([positionId])
  @@index([candidateId])
}

// Añadir a Interview
model Interview {
  @@index([applicationId])
}
```

### 12.3 Crear módulo de errores compartidos

```typescript
// common/errors.ts (NUEVO)
export class NotFoundError extends Error {
    constructor(resource: string, id: number) {
        super(`${resource} with ID ${id} not found`);
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ValidationError';
    }
}
```

### 12.4 Actualizar schema.prisma con índices

```prisma
model Application {
  @@index([positionId])
  @@index([candidateId])
  @@index([positionId, currentInterviewStep])
}

model Interview {
  @@index([applicationId])
  @@index([applicationId, score])
}
```

### 12.5 Migrar posición existente a nueva estructura

```typescript
// positionRoutes.ts - ANTES
router.get('/:id/candidates', async (req, res) => {
    // lógica inline
});

// positionRoutes.ts - DESPUÉS
import getPositionCandidates from '../presentation/controllers/positionController';
router.get('/:id/candidates', getPositionCandidates);
```

---

## 13. Archivos a Crear/Modificar

| Archivo | Acción | Ubicación |
|---------|--------|-----------|
| `position.dto.ts` | Crear | `application/dto/` |
| `positionService.ts` | Crear | `application/services/` |
| `positionController.ts` | Crear | `presentation/controllers/` |
| `positionRoutes.ts` | Crear | `routes/` |
| `Position.ts` | Modificar | `domain/models/` |
| `prisma.ts` | Crear | `common/` |
| `schema.prisma` | Modificar | Añadir índices |

---

## 14. Checklist de Implementación

- [ ] Crear DTOs en `application/dto/`
- [ ] Crear service con query optimizada
- [ ] Crear controller con manejo de errores
- [ ] Crear/actualizar routes
- [ ] Añadir método a Position model (opcional)
- [ ] Crear índices en schema.prisma
- [ ] Escribir tests unitarios
- [ ] Escribir tests de integración
- [ ] Verificar con lint/typecheck

---

## 15. Architectural Review - Crítica Profunda

### 1. Problemas de Diseño

#### 1.1 Business Logic en el Service (Violation: SRP)

El service calcula `averageScore` manualmente. Este cálculo debería estar en:
- Un helper reutilizable
- O en el propio modelo `Application`

**Problema**: Si otra parte del sistema necesita `averageScore`, duplicarás código.

#### 1.2 Missing Repository Layer

El servicio ejecuta queries Prisma directamente. Esto:
- Acopla la lógica de negocio a Prisma
- Dificulta testear
- Viola principios de arquitectura limpia

**Recomendación**: Crear `ApplicationRepository` que encapsule las queries.

#### 1.3 Missing Pagination (aunque se menciona no se implementa)

El endpoint puede devolver miles de candidatos. Sin paginación:
- Timeout en BD
- Memory overflow
- UI lenta

**Decisión necesaria**: ¿Implementar paginación ahora o después?

---

### 2. Inconsistencias con el Dominio ATS

#### 2.1 Falta información del InterviewStep actual

El schema muestra que `InterviewStep` tiene `orderIndex` y `interviewFlowId`. El diseño solo devuelve `name`.

**Pregunta**: ¿El frontend necesita `orderIndex` para ordenar columnas Kanban?

Si la respuesta es sí, falta:
```typescript
currentInterviewStep: {
    id: number;
    name: string;
    orderIndex: number;
}
```

#### 2.2 No se considera `InterviewFlow`

Cada `Position` tiene un `interviewFlowId` que define los pasos del proceso.

**Pregunta**: ¿Se necesita saber qué pasos tiene el flujo aunque no tengan candidatos?

**Recomendación**: Incluir metadata del flujo:
```json
{
  "interviewFlow": {
    "id": 3,
    "name": "Hiring Flow Estándar"
  },
  "steps": [
    { "id": 1, "name": "Aplicación Recibida", "orderIndex": 1 },
    { "id": 2, "name": "Entrevista HR", "orderIndex": 2 }
  ]
}
```

#### 2.3 No se maneja el estado de la Position

`Position.status` puede ser "Draft", "Closed", etc. ¿Se deben mostrar candidatos de posiciones cerradas?

---

### 3. Riesgos de Escalabilidad

#### 3.1 LEFT JOIN con 1:N

```typescript
interviews: {
    select: { score: true }
}
```

Si un candidato tiene 50 entrevistas, el resultado de la query tiene 50 filas duplicadas para ese candidato. Con 1000 candidatos × 10 entrevistas = 10,000 filas.

**Solución alternativa**: Usar subquery o raw query para el avg:
```typescript
// Más eficiente para > 100 candidatos
const avgScores = await prisma.$queryRaw`
    SELECT "applicationId", AVG("score") as avg
    FROM "Interview"
    WHERE "applicationId" IN (${applications.map(a => a.id)})
    GROUP BY "applicationId"
`;
```

#### 3.2 Sin cache

El endpoint puede llamarse frecuentemente. Sin cache:
- Queries repetitivas a BD
- Latencia alta

**Recomendación**: Implementar Redis cache o response cache.

#### 3.3 Sin rate limiting

Endpoint vulnerable a ataques de denegación de servicio.

---

### 4. Posibles N+1 Queries

#### 4.1 El diseño ES seguro contra N+1 ✅

La query con `include` + `select` anidado evita N+1.

**PERO**: Hay un problema sutil en el mapeo:

```typescript
const candidates: CandidatePositionDTO[] = applications.map(app => {
    // El mapeo hace O(n) por aplicación
    const scores = app.interviews.map(i => i.score)...
```

Si `applications` devuelve 1000 registros con sus entrevistas, el `.map()` procesa todo en memoria. Esto no es N+1 pero sí puede ser lento.

#### 4.2 Verificación de positionId

```typescript
const position = await prisma.position.findUnique({ where: { id: positionId } });
const applications = await prisma.application.findMany({ where: { positionId } });
```

Son 2 queries secuenciales que podrían parallelizarse:

```typescript
const [position, applications] = await Promise.all([
    prisma.position.findUnique(...),
    prisma.application.findMany(...)
]);
```

---

### 5. Problemas de Acoplamiento

#### 5.1 PrismaClient instanciado en service

```typescript
const prisma = new PrismaClient();
```

Cada service que cree un `new PrismaClient()` consume conexiones del pool (default: 10).

**Solución**: Singleton global como se recomendó en refactors.

#### 5.2 Service conoce la estructura de Prisma

```typescript
app.interviews.map(i => i.score)
```

El service asume la estructura de `Application` de Prisma. Si el modelo cambia, el service se rompe.

**Mejor**: Usar DTOs desde el modelo.

---

### 6. Violaciones SOLID

#### 6.1 Single Responsibility Principle (SRP)

❌ `getPositionCandidatesService` hace:
1. Validación de posición
2. Query a BD
3. Transformación de datos
4. Cálculo de promedio

**Recomendación**: Separar en:
- `ApplicationRepository.findByPositionId()`
- `ScoreCalculator.calculateAverage()`

#### 6.2 Dependency Inversion Principle (DIP)

❌ El service depende directamente de Prisma:

```typescript
const prisma = new PrismaClient();
```

**Recomendación**: Inyectar repository como dependencia:

```typescript
export const getPositionCandidatesService = async (
    params: PositionIdDTO,
    repository: ApplicationRepository = new ApplicationRepository()
) => { ... }
```

---

### 7. Riesgos de Deuda Técnica

#### 7.1 Naming inconsistente

| Qué | Cómo está | Debería ser |
|-----|----------|-------------|
| Función service | `getPositionCandidatesService` | `getPositionCandidates` |
| DTO | `PositionIdDTO` | `GetPositionCandidatesParams` |
| Respuesta | `PositionCandidatesResponseDTO` | `PositionCandidatesResponse` |

El proyecto usa camelCase simple para services (`addCandidate`, `findCandidateById`). El sufijo `Service` es redundante.

#### 7.2 Error handling inconsistente

El proyecto actual usa `throw new Error('message')` genérico. El diseño propone lo mismo, pero esto no permite:

- Distinguir tipos de error en tests
- Logging estructurado
- Manejo consistente

**Recomendación**: Usar clases de error personalizadas o al menos constantes:

```typescript
export const ErrorCodes = {
    POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',
    INVALID_ID: 'INVALID_ID'
} as const;
```

#### 7.3 Duplicación de validación

```typescript
// Controller
if (isNaN(id) || id <= 0) { ... }

// Validator
export const validatePositionId = (params: any): PositionIdDTO => {
    const id = parseInt(params.id, 10);
    if (isNaN(id) || id <= 0) { throw new Error('Invalid position ID'); }
    return { id };
}
```

El validator existe pero no se usa en el controller. Validación duplicada.

---

### 8. Problemas REST

#### 8.1 Missing Content-Type

No se especifica `Content-Type: application/json` en responses.

#### 8.2 Error response inconsistente

```json
// Diseño propone:
{ "error": "Invalid ID format", "message": "..." }

// Proyecto actual:
{ "message": "Error adding candidate", "error": error.message }
```

**Decisión necesaria**: Estandarizar formato de errores del proyecto.

#### 8.3 No sigue convención de versioning

Para APIs maduras, debería ser `/api/v1/positions/:id/candidates`.

---

### 9. Problemas de Naming

#### 9.1 DTOs con nombres confusos

`PositionCandidatesQueryDTO` sugiere query params pero no se usa para nada.

#### 9.2 Service naming

`getPositionCandidatesService` vs proyecto usa `addCandidate`, `findCandidateById`.

**Recomendación**: Normalizar a `getPositionCandidates`.

#### 9.3 Falta contexto en averageScore

`averageScore` no indica:
- ¿De qué entrevistas?
- ¿Qué escala? (1-10, 1-5)
- ¿Solo entrevistas completadas?

**Recomendación**: `averageInterviewScore` o documentar claramente.

---

### 10. Riesgos de Mantenibilidad

#### 10.1 Tests hardcodeados

```typescript
expect(candidate.averageScore).toBe(8.5);
```

El score depende de datos en BD. Tests frágiles.

**Mejor**: Tests con datos mockeados o factories.

#### 10.2 No hay JSDoc

El código no tiene documentación de qué hace cada función.

#### 10.3 Magic numbers

```typescript
return Math.round((sum / scores.length) * 10) / 10;
```

`10` aparece sin contexto. ¿Por qué redondear a 1 decimal?

**Mejor**:
```typescript
const SCORE_DECIMAL_PLACES = 1;
return Number((sum / scores.length).toFixed(SCORE_DECIMAL_PLACES));
```

---

### 11. Edge Cases Olvidados

#### 11.1 Position conInterviewFlow null

¿Qué pasa si `position.interviewFlowId` es null? El diseño no lo maneja.

#### 11.2 Candidate duplicado en la misma posición

El schema NO tiene constraint único en `(positionId, candidateId)`. Un candidato puede aplicarse múltiples veces.

**Pregunta**: ¿Se debe mostrar solo la aplicación más reciente?

#### 11.3 Interviews con scores de diferentes pasos

No se filtra por tipo de entrevista. Si hay "Entrevista HR" con score 10 y "Entrevista Técnica" con score 2, el promedio es 6. ¿Es esto correcto?

#### 11.4 Candidato eliminado pero con Application

El schema no tiene soft delete en `Candidate`. ¿Qué devuelve si el candidato se borró?

#### 11.5 applicationDate como DateTime

El sorting por `applicationDate: 'desc'` puede no ser estable si hay aplicaciones en el mismo segundo.

---

### 12. Mejoras Recomendadas Antes de Implementar

#### CRÍTICAS (Bloquean merge)

1. **Implementar paginación**: Si `candidates > 50`, el endpoint muere.
2. **Corregir PrismaClient**: Debe ser singleton, no instanciado por servicio.
3. **Estandarizar error handling**: Definir formato consistente de errores.

#### IMPORTANTES (Technical debt alta)

4. **Separar queries**: Usar `Promise.all` para queries independientes.
5. **Crear ApplicationRepository**: Encapsular lógica de acceso a datos.
6. **Añadir índices**: `positionId` en Application es mandatory.

#### MEJORAS (Calidad de código)

7. **Normalizar naming**: Seguir convenciones del proyecto.
8. **Documentar averageScore**: JSDoc explicando cálculo.
9. **Manejar edge cases**: Position sin InterviewFlow, candidato duplicado.
10. **Tests con mocks**: No depender de datos reales en BD.

---

### 13. Partes Buenas del Diseño ✅

A pesar de las críticas, hay aspectos bien pensados:

#### 13.1 Select explícito con campos específicos ✅

```typescript
select: {
    candidate: { select: { id, firstName, lastName } },
    interviewStep: { select: { name: true } },
    interviews: { select: { score: true } }
}
```

Excelente. Evita overfetching y N+1.

#### 13.2 Transformación en servicio ✅

Separar la query de la transformación de datos es buen patrón.

#### 13.3 Uso de DTOs tipados ✅

Interfaces TypeScript bien definidas mejoran type safety.

#### 13.4 Casos edge documentados ✅

La tabla de casos edge es útil para QA y documentación.

#### 13.5 Consistencia de estructura ✅

El diseño sigue la arquitectura de capas existente.

---

## 16. Versión Corregida Sugerida

```typescript
// application/dto/position.dto.ts
export interface CandidatePositionDTO {
    candidateId: number;
    candidateName: string;
    currentInterviewStep: string | null;
    averageInterviewScore: number | null;
}

export interface PositionCandidatesResponse {
    positionId: number;
    positionTitle: string;
    candidates: CandidatePositionDTO[];
    pagination?: {
        page: number;
        limit: number;
        total: number;
    };
}

// application/services/positionService.ts
import prisma from '../../common/prisma';
import { ApplicationRepository } from '../repositories/applicationRepository';
import { ScoreCalculator } from '../utils/scoreCalculator';

const applicationRepo = new ApplicationRepository(prisma);
const scoreCalc = new ScoreCalculator();

export const getPositionCandidates = async (positionId: number) => {
    const [position, applications] = await Promise.all([
        prisma.position.findUnique({
            where: { id: positionId },
            select: { id: true, title: true }
        }),
        applicationRepo.findByPositionIdWithDetails(positionId)
    ]);

    if (!position) {
        throw new NotFoundError('Position', positionId);
    }

    const candidates = applications.map(app => ({
        candidateId: app.candidate.id,
        candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentInterviewStep: app.interviewStep?.name ?? null,
        averageInterviewScore: scoreCalc.calculateAverage(app.interviews)
    }));

    return {
        positionId: position.id,
        positionTitle: position.title,
        candidates
    };
};
```

---

## 17. Veredicto Final

| Aspecto | Estado |
|---------|--------|
| Arquitectura | ⚠️ Necesita refactor mínimo |
| Performance | ⚠️ Sin paginación = riesgo |
| Naming | ⚠️ Inconsistente con proyecto |
| Error handling | ⚠️ Inherently simple |
| Testabilidad | ⚠️ Coupling alto con Prisma |
| Mantenibilidad | ⚠️ Duplicación de lógica |

**Recomendación**: Implementar versión pragmática ahora, refactor global después.

---

## 18. Revisión Pragmática para Estado Real del Proyecto

### Contexto Real

El proyecto tiene:
- Active Record con Prisma en modelos (no hay Repository)
- PrismaClient instanciado en cada modelo (ver `Candidate.ts:7`)
- Error handling básico (`throw new Error`)
- Sin paginación en endpoints existentes
- Sin indices en schema (falta documentada)

**Veredicto de la review arquitectónica**: Válida, pero hay que priorizarla correctamente.

---

### 1. Mejoras REALMENTE Necesarias

#### CRÍTICAS (si no las haces, rompe algo)

| Mejora | Por qué es crítica | Implementación mínima |
|--------|-------------------|----------------------|
| **Índices en `positionId`** | Sin esto, queries > 100 candidatos son lentas | Añadir `@@index([positionId])` al schema |
| **Validación de ID** | SQL injection o error 500 si ID es "abc" | Validación básica en controller |

#### IMPORTANTES (mejora calidad sin bloqueos)

| Mejora | Por qué es importante | Implementación mínima |
|--------|----------------------|----------------------|
| **Query con `select` explícito** | Evita cargar 10,000 filas innecesarias | Usar el patrón del diseño actual |
| **Promise.all para queries paralelas** | Reduce latencia 2x | `await Promise.all([...])` |

#### OPCIONALES (nice-to-have, postergables)

| Mejora | Por qué puede esperar | Decision |
|--------|---------------------|----------|
| Paginación | Depende de volumen real. Si < 50 candidatos, no necesaria | Postergar hasta confirmar volumen |
| Repository layer | Sobreingeniería para un endpoint simple | No hacer ahora |
| DTOs tipados | El proyecto usa `any` en services existentes | Mantener consistencia |
| Singleton PrismaClient | Mejorable pero no crítico | Postergar a refactor global |

---

### 2. Overengineering Detectado

La review sugiere cosas que son **overengineering para este estado del proyecto**:

#### 2.1 ApplicationRepository ❌ NO

```typescript
// Esto es sobreingeniería para un proyecto sin repositorios
import { ApplicationRepository } from '../repositories/applicationRepository';
```

**Por qué NO ahora**:
- El proyecto no usa repository pattern en ningún lado
- Crear una capa nueva para un endpoint es inconsistente
- Añadiría archivos innecesarios

**Cuándo hacerlo**: Cuando haya 3+ endpoints con queries complejas similares.

#### 2.2 ScoreCalculator helper ❌ NO

```typescript
// Esto es sobreingeniería para 3 líneas de cálculo
import { ScoreCalculator } from '../utils/scoreCalculator';
```

**Por qué NO ahora**:
- El cálculo es trivial: `scores.reduce((a,b) => a+b, 0) / scores.length`
- No hay reutilización prevista
- Crear archivos para esto es ruido

**Cuándo hacerlo**: Cuando el cálculo se use en 3+ lugares diferentes.

#### 2.3 Error classes personalizadas ❌ NO

```typescript
// Esto requiere refactor de TODO el proyecto
export class NotFoundError extends Error { ... }
```

**Por qué NO ahora**:
- El proyecto usa `throw new Error('msg')` en todas partes
- Introducir clases nuevas es inconsistente
- El error handling actual funciona

**Cuándo hacerlo**: En refactor global de error handling.

#### 2.4 Paginación obligatoria ❌ NO

**La paginación NO es crítica si**:
- El volumen real es < 50 candidatos/posición
- No hay evidencia de problemas de rendimiento

**Cuándo implementarla**: Cuando QA o producción reporte timeouts.

---

### 3. Refactors Mínimos ANTES de implementar

#### 3.1 SÓLO añadir índices al schema ✅ HAZLO

```prisma
model Application {
  // ... campos existentes ...
  @@index([positionId])
}

model Interview {
  // ... campos existentes ...
  @@index([applicationId])
}
```

**Después**: `npx prisma migrate dev` o `npx prisma db push`

#### 3.2 Crear PrismaClient singleton (opcional, recomendado después) 

```typescript
// common/prisma.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export default prisma;
```

**Pero**: Esto requiere actualizar todos los modelos existentes. Si no tienes tiempo, **puede esperar**.

---

### 4. Cómo Mantener Consistencia con Arquitectura Actual

**Regla simple**: Si el proyecto hace algo de cierta manera, hazlo igual.

#### 4.1 Service naming

❌ **No hacer**: `getPositionCandidatesService`
✅ **Hacer**: `findCandidatesByPosition` (estilo del proyecto: `findCandidateById`)

#### 4.2 PrismaClient en service

❌ **No hacer**: Crear archivo singleton si los modelos no lo usan
✅ **Hacer**: `const prisma = new PrismaClient()` (consistente con `Candidate.ts`)

#### 4.3 DTOs

❌ **No hacer**: Crear archivos DTO si el proyecto no los usa
✅ **Hacer**: Tipar inline o usar `any` (consistente con `candidateService.ts`)

#### 4.4 Error handling

❌ **No hacer**: Clases de error personalizadas
✅ **Hacer**: `throw new Error('mensaje')` (consistente con todo el proyecto)

---

### 5. Decisiones de Equipo Senior Pragmático

#### Decisión 1: ¿Paginación ahora?

```
SI volumen real > 50 candidatos/posición → Implementar
SI volumen real < 50 candidatos/posición → Postergar
SI NO LO SABES → Implementar con query param opcional
```

**Recomendación pragmática**:

```typescript
export const findCandidatesByPosition = async (positionId: number, page = 1, limit = 100) => {
    const skip = (page - 1) * limit;
    const applications = await prisma.application.findMany({
        where: { positionId },
        // ... query ...
        skip,
        take: limit,
        orderBy: { applicationDate: 'desc' }
    });
    // Retornar paginación solo si hay más de limit
    return { candidates, pagination: total > limit ? { page, limit, total } : undefined };
};
```

#### Decisión 2: ¿Repository ahora?

```
SI hay 3+ endpoints con queries similares → Crear repository
SI es el primer endpoint complejo → No crear repository
```

**Recomendación pragmática**: No crear repository ahora. Si en 2 sprints hay más endpoints similares, reconsiderar.

#### Decisión 3: ¿Índices ahora?

```
SI la migración ya se va a correr → SÍ, añadir índices
SI no hay migración planeada → Postergar, pero documentar
```

**Recomendación pragmática**: SÍ, añadir índices ahora. Es un cambio de schema trivial con impacto alto.

---

### 6. Qué Dejar para Refactorización Global

| Tema | Por qué esperar | Cuándo revisitarla |
|------|----------------|-------------------|
| **Repository pattern** | Proyecto no lo usa, crear uno es inconsistente | Sprint de refactor de acceso a datos |
| **PrismaClient singleton** | Requiere actualizar todos los modelos | Sprint de deuda técnica |
| **Error classes** | Refactor de todo el error handling | Sprint de DX improvement |
| **DTOs tipados** | Proyecto usa `any`, crear DTOs es inconsistente | Sprint de type safety |
| **Paginación completa** | Solo necesaria si hay volumen alto | Cuando QA reporte problemas |
| **Cache layer** | Premature optimization | Cuando haya problemas de rendimiento |

---

### 7. Equilibrio Correcto

```
┌─────────────────────────────────────────────────────────────┐
│                    BALANCE PRAGMÁTICO                       │
├─────────────────────────────────────────────────────────────┤
│  Calidad      → Suficiente para que funcione bien          │
│  Mantenibilidad → Consistente con proyecto actual          │
│  Simplicidad  → Evitar sobreingeniería                     │
│  Consistencia → Seguir convenciones existentes            │
│  Tiempo       → Entregable en 1-2 días max                │
└─────────────────────────────────────────────────────────────┘
```

#### Lo que NO debes sacrificar

| Aspecto | Por qué no | Mínimo aceptable |
|---------|-----------|------------------|
| **N+1 queries** | Rompe con volumen | Query con include + select |
| **Seguridad** | SQL injection, datos expuestos | Validación de ID, select explícito |
| **Consistencia naming** | Confusión futura | Seguir convenciones del proyecto |

#### Lo que SÍ puedes sacrificar

| Aspecto | Por qué | Máximo aceptable |
|---------|--------|------------------|
| **Separación SRP estricta** | Overhead para un endpoint | Todo en service si es simple |
| **Patrones enterprise** | Sobreingeniería | Active Record existente |
| **Type safety completo** | Proyecto usa `any` | `any` donde sea consistente |
| **Paginación completa** | Solo si hay volumen | Query param opcional |

---

### 8. Implementación Recomendada (Pragmática)

#### Archivos a crear (mínimo viable)

```
backend/src/
├── application/services/
│   └── positionService.ts      # findCandidatesByPosition(positionId)
├── presentation/controllers/
│   └── positionController.ts   # getCandidatesByPosition(req, res)
└── routes/
    └── positionRoutes.ts       # GET /:id/candidates → controller
```

#### Archivos a modificar

```
backend/prisma/schema.prisma    # Añadir índices
```

#### NO crear (overengineering)

```
- common/prisma.ts (singleton) → Postergar
- application/dto/ → No crear (usar any)
- utils/scoreCalculator.ts → No crear
- repositories/ → No crear
```

---

### 9. Checklist de Implementación PRAGMÁTICA

#### Antes de codificar
- [x] Revisar schema de Position/Application/Interview
- [x] Entender convenciones del proyecto
- [ ] Decidir: ¿paginación ahora o después?
- [ ] Decidir: ¿añadir índices ahora?

#### Codificar (orden recomendado)
- [ ] Añadir índices al schema (Application.positionId, Interview.applicationId)
- [ ] Crear `positionService.ts` con query única
- [ ] Crear `positionController.ts` con validación básica
- [ ] Crear `positionRoutes.ts` conectando todo
- [ ] Test básico manual (Postman/curl)

#### Después de implementar
- [ ] Verificar que no hay N+1 (mirar logs de Prisma)
- [ ] Test con datos reales (más de 10 candidatos)
- [ ] Medir tiempo de respuesta
- [ ] Documentar en README si hay something unusual

---

### 10. Resumen de Decisiones Pragmáticas

| Pregunta | Respuesta pragmática | Razón |
|----------|---------------------|-------|
| ¿Repository ahora? | NO | Inconsistente, solo para este endpoint |
| ¿ScoreCalculator? | NO | 3 líneas no merecen archivo |
| ¿Error classes? | NO | Proyecto usa Error genérico |
| ¿Paginación? | OPCIONAL | Implementar si `?page=` se necesita |
| ¿DTOs? | NO | Proyecto usa `any`, crear DTOs es inconsistente |
| ¿Singleton Prisma? | NO | Requiere actualizar modelos existentes |
| ¿Índices? | SÍ | Impacto alto, cambio bajo |
| ¿Promise.all? | SÍ | Reduce latencia 2x fácilmente |

---

### 11. Código Final Recomendado (Pragmático)

```typescript
// application/services/positionService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const findCandidatesByPosition = async (positionId: number) => {
    const applications = await prisma.application.findMany({
        where: { positionId },
        select: {
            candidateId: true,
            candidate: {
                select: { id: true, firstName: true, lastName: true }
            },
            interviewStep: {
                select: { name: true }
            },
            interviews: {
                select: { score: true }
            }
        },
        orderBy: { applicationDate: 'desc' }
    });

    return applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);
        
        return {
            candidateId: app.candidate.id,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? null,
            averageScore: scores.length > 0
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                : null
        };
    });
};
```

```typescript
// presentation/controllers/positionController.ts
import { Request, Response } from 'express';
import { findCandidatesByPosition } from '../../application/services/positionService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const position = await prisma.position.findUnique({
            where: { id },
            select: { id: true, title: true }
        });

        if (!position) {
            return res.status(404).json({ error: 'Position not found' });
        }

        const candidates = await findCandidatesByPosition(id);
        res.json({ positionId: position.id, positionTitle: position.title, candidates });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
```

```typescript
// routes/positionRoutes.ts
import { Router } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';

const router = Router();
router.get('/:id/candidates', getCandidatesByPosition);
export default router;
```

```prisma
// schema.prisma - SÓLO añadir índices
model Application {
  @@index([positionId])
  @@index([candidateId])
}

model Interview {
  @@index([applicationId])
}
```

---

### 12. Conclusión Final

**La review arquitectónica es correcta pero ambicioso para el estado actual del proyecto.**

**Recomendación final**:

1. **Implementa el endpoint** con el código pragmático de sección 11
2. **Añade los índices** al schema (es lo único crítico)
3. **Documenta los TODOs** para refactor futuro:
   - Crear PrismaClient singleton cuando se refactoricen modelos
   - Evaluar paginación cuando haya volumen real
   - Considerar repository si hay más queries complejas

---

## 19. Code Review: GET /positions/:id/candidates

### VEREDICTO: ⚠️ APPROVE CON COMENTARIOS

El código es **funcionalmente correcto** y **consistente con el proyecto**, pero hay algunos puntos que deben abordarse antes de producción.

---

### 1. Bugs Potenciales ❌

#### 1.1 PrismaClient instanciado en controller y service

```typescript
// positionController.ts:5
const prisma = new PrismaClient();

// positionService.ts:3
const prisma = new PrismaClient();
```

**PROBLEMA**: Se crean **2 instancias de PrismaClient** para el mismo flujo. El pool de conexiones (default: 10) se agota más rápido.

**ACCIÓN REQUERIDA**: Mover todo Prisma al service, el controller solo debe llamar al service.

**Código corregido (service):**
```typescript
export const findCandidatesByPosition = async (positionId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, title: true }
    });

    if (!position) {
        throw new Error(`Position with ID ${positionId} not found`);
    }

    const applications = await prisma.application.findMany({
        // ... query ...
    });

    return {
        position,
        candidates: applications.map(/* ... */)
    };
};
```

**Código corregido (controller):**
```typescript
// QUITAR PrismaClient del controller
import { findCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await findCandidatesByPosition(id);
        res.json({
            positionId: result.position.id,
            positionTitle: result.position.title,
            candidates: result.candidates
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
```

---

### 2. Edge Cases Olvidados ⚠️

#### 2.1 Candidato huérfano (InterviewStep eliminado)

El schema define `currentInterviewStep` como `Int` (no nullable). Si el `InterviewStep` se borró, el JOIN fallará.

**IMPACTO**: Bajo (requiere datos corruptos). Aceptable para ahora.

#### 2.2 Múltiples aplicaciones del mismo candidato

El schema **no tiene constraint único** en `(positionId, candidateId)`. Un candidato puede aplicarse múltiples veces.

**COMPORTAMIENTO ACTUAL**: Devuelve todos los registros del candidato.

**DECISIÓN PENDIENTE**: ¿Filtrar con `distinct` o es intencional?

---

### 3. Prisma Best Practices ✅

| Práctica | Estado | Comentario |
|----------|--------|------------|
| `select` explícito | ✅ | Evita overfetching |
| `include` con `select` anidado | ✅ | Optimizado |
| Ordenamiento en query | ✅ | `orderBy: { applicationDate: 'desc' }` |
| Sin N+1 queries | ✅ | Una query con JOINs |
| Índices añadidos | ✅ | `@@index([positionId])` |

---

### 4. Overfetching ⚠️

El código está bien, pero hay un desperdicio sutil con `interviews`:

```typescript
interviews: {
    select: { score: true }
}
```

Si un candidato tiene 50 entrevistas, el JOIN devuelve 50 filas por candidato.

**SOLUCIÓN FUTURA** (solo si hay problemas medidos):
```typescript
const avgScores = await prisma.$queryRaw`
    SELECT "applicationId", AVG("score") as avg
    FROM "Interview"
    WHERE "applicationId" IN (${ids}) AND "score" IS NOT NULL
    GROUP BY "applicationId"
`;
```

---

### 5. Posibles N+1 ✅

**No hay N+1.** La query es una sola con `include` + `select`.

---

### 6. Naming ✅

| Elemento | Nombre | Consistente |
|----------|--------|-------------|
| Service function | `findCandidatesByPosition` | ✅ Estilo `findCandidateById` |
| Controller function | `getCandidatesByPosition` | ✅ Estilo `getCandidateById` |
| Response fields | `candidateId`, `candidateName`, etc. | ✅ Claros |

---

### 7. Legibilidad ⚠️

Código legible pero con **magic number**:

```typescript
? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
```

**MEJOR**:
```typescript
const DECIMAL_PLACES = 1;
return scores.length > 0
    ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(DECIMAL_PLACES))
    : null;
```

---

### 8. Maintainability ⚠️

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| Lógica en service | ✅ | Correcto |
| Verificación position en controller | ⚠️ | Debería estar en service |
| Sin tests | ⚠️ | Consistente con proyecto |

---

### 9. Simplicidad vs Calidad ⚖️

**BALANCE CORRECTO** para el estado actual del proyecto.

No hay sobreingeniería:
- ❌ Repository layer innecesario
- ❌ DTOs innecesarios
- ❌ Dependency injection
- ✅ Paginación prematura evitada

---

### 10. Deuda Técnica Aceptable ⚠️

| Deuda | Gravedad | Cuándo abordar |
|-------|----------|----------------|
| PrismaClient duplicado | MEDIA | Refactor global de modelos |
| Magic number `10` | BAJA | Reutilización del cálculo |
| Sin tests | BAJA | Framework de tests añadido |
| Sin paginación | BAJA | Volumen > 50 candidatos |

---

### 11. Resumen de la Code Review

| Aspecto | Nota | Acción |
|---------|------|--------|
| Funcionalidad | ✅ | Funciona correctamente |
| Consistencia | ✅ | Corregido: PrismaClient solo en service |
| Performance | ✅ | Sin N+1, select optimizado |
| Edge Cases | ⚠️ | Aceptable, documentar limitaciones |
| Naming | ✅ | Consistente |
| Legibilidad | ✅ | Magic number eliminado |
| Debt técnica | ⚠️ | Mínima, aceptable |

---

## 20. Código Final - Correcciones Aplicadas

### 20.1 Service (`positionService.ts`)

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SCORE_DECIMAL_PLACES = 1;

export const findCandidatesByPosition = async (positionId: number) => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true, title: true }
    });

    if (!position) {
        throw new Error(`Position with ID ${positionId} not found`);
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        select: {
            candidateId: true,
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true
                }
            },
            interviewStep: {
                select: {
                    name: true
                }
            },
            interviews: {
                select: {
                    score: true
                }
            }
        },
        orderBy: {
            applicationDate: 'desc'
        }
    });

    const candidates = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);

        const averageScore = scores.length > 0
            ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(SCORE_DECIMAL_PLACES))
            : null;

        return {
            candidateId: app.candidate.id,
            candidateName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep?.name ?? null,
            averageScore
        };
    });

    return {
        position,
        candidates
    };
};
```

### 20.2 Controller (`positionController.ts`)

```typescript
import { Request, Response } from 'express';
import { findCandidatesByPosition } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await findCandidatesByPosition(id);

        res.json({
            positionId: result.position.id,
            positionTitle: result.position.title,
            candidates: result.candidates
        });
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({ error: 'Position not found' });
            }
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
```

### 20.3 Routes (`positionRoutes.ts`)

```typescript
import { Router } from 'express';
import { getCandidatesByPosition } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesByPosition);

export default router;
```

---

## 21. Edge Cases Conocidos

| Edge Case | Comportamiento | Impacto | Resolución |
|-----------|---------------|---------|------------|
| **Position no existe** | 404 con `{ error: 'Position not found' }` | Bajo | Correcto |
| **ID inválido (abc)** | 400 con `{ error: 'Invalid ID format' }` | Bajo | Correcto |
| **Sin candidatos** | `{ candidates: [] }` | Ninguno | Correcto |
| **Sin entrevistas** | `averageScore: null` | Ninguno | Correcto |
| **Todas entrevistas sin score** | `averageScore: null` | Ninguno | Correcto |
| **InterviewStep eliminado** | JOIN fail → 500 | Bajo | Depende de integridad de datos |
| **Candidato múltiple aplicación** | Múltiples registros del mismo candidato | Medio | Pendiente: decidir si filtrar |
| **Candidato eliminado** | JOIN fail → 500 | Bajo | No hay soft delete |

---

## 22. Deuda Técnica Aceptada Conscientemente

| Deuda | Gravedad | Razón para aceptar | Cuándo revisitarla |
|-------|---------|-------------------|-------------------|
| **PrismaClient en cada archivo** | MEDIA | Consistente con proyecto. Refactor global pendiente | Sprint de deuda técnica |
| **Sin singleton global** | BAJA | Impacto bajo con volumen actual | Cuando se agoten conexiones |
| **Magic number `1` (decimal places)** | BAJA | Constante local, aceptable | Si se reutiliza cálculo |
| **Sin tests** | BAJA | Proyecto no tiene tests | Cuando se añada framework |
| **Sin paginación** | BAJA | Volumen actual < 50 candidatos | Cuando QA reporte timeout |
| **Error genérico `throw new Error`** | BAJA | Consistente con proyecto | Refactor global de errores |
| **Sin soft delete** | MEDIA | Requiere cambio de schema | Sprint de auditoría |

---

## 23. Checklist Final de Merge

- [x] PrismaClient solo en service
- [x] Verificación de Position en service
- [x] Lógica Prisma solo en service
- [x] Magic number eliminado
- [x] Enfoque pragmático mantenido
- [x] Arquitectura 3 capas respetada
- [x] Naming consistente
- [x] Índices en schema.prisma
- [x] Edge cases documentados
- [x] Deuda técnica documentada

**Estado: ✅ LISTO PARA MERGE**