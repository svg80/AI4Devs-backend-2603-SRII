Prompts en opencode con modelo MiniMax M2.5 Free OpenCode Zen

# Prompt 1 - Conocimiento del proyecto

````markdown
Actúa como un Software Architect Senior, Tech Lead y Staff Engineer especializado en análisis de proyectos legacy y sistemas enterprise.

Tu misión es analizar este proyecto completo (frontend + backend) y generar un informe técnico exhaustivo que permita a un nuevo equipo continuar el desarrollo con pleno conocimiento de la arquitectura y decisiones técnicas.

Necesito que investigues TODO lo posible del proyecto de forma sistemática.

# OBJETIVO

Descubrir y documentar:

- Arquitectura general
- Stack tecnológico
- Patrones arquitectónicos
- Dominio de negocio
- Organización del código
- Calidad técnica
- Estado del proyecto
- Riesgos
- Deuda técnica
- Flujo de datos
- Infraestructura
- DevOps
- Testing
- Seguridad
- Base de datos
- Integraciones
- Nivel de madurez del sistema

---

# ANÁLISIS REQUERIDO

## 1. Visión global del sistema

Explica:

- Qué hace el sistema
- Qué problema de negocio resuelve
- Qué módulos existen
- Qué bounded contexts o dominios aparecen
- Qué tipo de aplicación es:
  - monolito
  - monolito modular
  - microservicios
  - event-driven
  - hexagonal
  - clean architecture
  - n-capas
  - serverless
  - etc.

Genera también:

- mapa de módulos
- flujo general
- relaciones frontend/backend
- dependencias entre servicios

---

## 2. Stack tecnológico

Identifica todas las tecnologías usadas:

### Frontend
- framework
- state management
- routing
- UI libraries
- estilos
- testing
- build system
- bundler
- SSR/CSR
- i18n
- formularios
- validaciones

### Backend
- lenguaje
- framework
- ORM
- autenticación
- autorización
- APIs
- colas
- caché
- mensajería
- scheduler
- logs
- observabilidad

### Infraestructura
- Docker
- Kubernetes
- CI/CD
- cloud provider
- Terraform
- nginx
- gateways
- proxies
- CDN

Indica versiones si es posible.

---

## 3. Arquitectura y patrones

Detecta:

- DDD
- TDD
- BDD
- CQRS
- Event Sourcing
- Clean Architecture
- Hexagonal Architecture
- Onion Architecture
- SOLID
- Repository Pattern
- Unit of Work
- Mediator
- Saga
- Circuit Breaker
- Feature-based architecture
- Screaming architecture

Explica evidencias concretas encontradas en el código.

No supongas nada:
solo afirma patrones que realmente estén implementados.

---

## 4. Estructura del frontend

Analiza:

- organización de carpetas
- arquitectura del frontend
- componentes reutilizables
- atomic design
- gestión de estado
- flujo de datos
- comunicación con backend
- gestión de errores
- lazy loading
- performance
- accesibilidad
- SEO
- seguridad frontend

Detecta:
- code smells
- anti-patterns
- acoplamientos
- deuda técnica

---

## 5. Estructura del backend

Analiza:

- capas
- módulos
- servicios
- controladores
- dominio
- repositorios
- entidades
- DTOs
- casos de uso
- middleware
- interceptores
- validaciones
- manejo de errores
- logging
- configuración

Explica:
- flujo completo de una request
- ciclo de vida
- dependencias

---

## 6. Base de datos

Analiza:

- motor de base de datos
- esquema
- relaciones
- tablas principales
- agregados
- índices
- migraciones
- seeds
- rendimiento
- normalización
- anti-patterns
- transacciones
- consistencia
- concurrencia

Detecta:
- posibles cuellos de botella
- problemas de escalabilidad
- riesgos de integridad

Genera un resumen del modelo de dominio inferido desde la BD.

---

## 7. APIs e integraciones

Identifica:

- REST
- GraphQL
- gRPC
- WebSockets
- eventos
- colas
- integraciones externas
- proveedores terceros

Documenta:
- endpoints principales
- autenticación
- versionado
- contratos
- serialización
- validaciones

---

## 8. Testing y calidad

Analiza:

- cobertura
- unit tests
- integration tests
- e2e
- mocks
- fixtures
- factories
- estrategia de testing

Determina:
- si realmente siguen TDD
- calidad de los tests
- gaps críticos

---

## 9. DevOps e infraestructura

Detecta:

- pipelines CI/CD
- estrategias de despliegue
- environments
- variables de entorno
- secretos
- observabilidad
- monitoreo
- tracing
- métricas
- logging centralizado

Analiza:
- Dockerfiles
- docker-compose
- Kubernetes
- Helm
- Terraform
- workflows

---

## 10. Seguridad

Evalúa:

- autenticación
- autorización
- JWT
- OAuth
- gestión de secretos
- CORS
- CSRF
- XSS
- SQL Injection
- validación de inputs
- rate limiting
- permisos
- roles

Indica riesgos potenciales.

---

## 11. Calidad arquitectónica

Evalúa:

- cohesión
- acoplamiento
- mantenibilidad
- escalabilidad
- legibilidad
- modularidad
- complejidad
- deuda técnica

Identifica:
- puntos críticos
- módulos frágiles
- riesgos de evolución

---

## 12. Convenciones y estándares

Detecta:

- linters
- formatters
- convenciones de nombres
- estándares de commits
- ramas git
- arquitectura consistente
- patrones repetidos

---

## 13. Estado del proyecto

Determina:

- nivel de madurez
- estabilidad
- mantenibilidad
- riesgos
- partes incompletas
- código muerto
- TODOs
- FIXMEs
- features abandonadas

---

## 14. Onboarding técnico

Genera finalmente:

### Un resumen ejecutivo
explicando:
- cómo está construido el sistema
- cómo arrancarlo
- cómo depurarlo
- cómo desplegarlo
- cómo desarrollar nuevas features correctamente

### Y una guía para un nuevo desarrollador:
- qué debe leer primero
- módulos críticos
- trampas del sistema
- mejores prácticas internas

---

# FORMATO DE RESPUESTA

Quiero:

- lenguaje técnico y preciso
- diagramas en texto si ayudan
- tablas resumen
- evidencias concretas del código
- referencias a archivos importantes
- explicaciones profundas
- NO respuestas genéricas

Cuando detectes algo:
- explica por qué
- qué evidencia lo demuestra
- qué implicaciones tiene

Si algo no puede inferirse claramente:
indícalo explícitamente.

No inventes información.

Piensa como un arquitecto software auditando un sistema real enterprise.

Documéntalo en docs/ai4devs-backend.md
````

---

# Prompt 2 - Análisis y descubrimiento de base de datos

````markdown
Actúa como un experto en base de datos. Analiza exclusivamente el fichero schema.prisma y explícame en detalle:

1. Cómo están modeladas las entidades

2. Qué relaciones existen entre ellas.

3. Qué claves foráneas usa cada modelo.

4. Cardinalidades exactas

5. Genera un documento en formato de mermaid

6. Qué campos serían relevantes para implementar:
GET /positions/:id/candidates

7. Explica:
- cómo obtener todas las applications de una posición
- cómo obtener el currentInterviewStep
- cómo obtener las entrevistas asociadas
- cómo calcular la puntuación media de un candidato

8. Detecta posibles problemas:
- nullable fields
- relaciones ambiguas
- naming inconsistente
- cascadas peligrosas
- falta de índices

9. Dame ejemplos reales de queries Prisma recomendadas para este caso.

Documéntalo en docs/database.md
````

---

# Prompt 3 - Analisis de modelos y services existentes

````markdown
Analiza cómo el proyecto implementa actualmente el acceso a datos y la lógica de negocio.

Quiero que revises:
- backend/src/domain/models/Candidate.ts
- backend/src/application/services/candidateService.ts
- backend/src/presentation/controllers/candidateController.ts
- backend/src/routes/candidateRoutes.ts

Y me expliques:

1. Qué patrón arquitectónico real están usando.
2. Cómo se construyen las queries Prisma.
3. Dónde se coloca la lógica de negocio.
4. Cómo manejan errores.
5. Cómo manejan includes/relations.
6. Cómo estructuran controllers/services/models.
7. Qué convenciones debo seguir para mantener consistencia.
8. Qué malas prácticas existen que NO debería replicar.
9. Cómo debería implementarse un nuevo endpoint de lectura complejo siguiendo el estilo actual pero mejorándolo si es necesario.

Documéntalo en docs/modelos_servicios.md
````

---

# Prompt 4 - Diseñar la respuesta

````markdown
Actúa como un Software Architect Senior especializado en diseño de APIs REST.

En base al dominio actual del proyecto ATS, diseña el contrato de respuesta ideal para:

GET /positions/:id/candidates

Objetivo:
alimentar una interfaz kanban de candidatos por posición.

Quiero que determines:

1. Qué campos mínimos debería devolver el endpoint.
2. Qué campos adicionales serían recomendables para evitar futuras modificaciones.
3. Qué IDs son necesarios para futuras operaciones drag & drop.
4. Qué estructura JSON sería más mantenible.
5. Cómo representar correctamente:
   - currentInterviewStep
   - averageScore
   - candidate
   - application
6. Cómo manejar:
   - scores null
   - candidatos sin entrevistas
   - pasos inexistentes
7. Qué anti-patterns REST evitar.
8. Qué estrategia seguirías para mantener backward compatibility.

Documéntalo en docs/diseno-get.md
````

---

# Prompt 5 - Ajustar el diseño exclusivamente a lo solicitado

````markdown
La solución aportada en docs/diseno-get.md debe ajustarse exclusivamente a lo solicitado:

Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar la siguiente información básica:

Nombre completo del candidato (de la tabla candidate).

current_interview_step: en qué fase del proceso está el candidato (de la tabla application).

La puntuación media del candidato. Recuerda que cada entrevist (interview) realizada por el candidato tiene un score
````

---

# Prompt 6 - Análisis de rendimiento

````markdown
Analiza el posible impacto de rendimiento de implementar:

GET /positions/:id/candidates

Necesito que evalúes:

1. Riesgos de N+1 queries.
2. Qué estrategia Prisma sería mejor:
   - include
   - select
   - aggregate
   - groupBy
3. Cómo calcular efficiently el averageScore.
4. Qué índices serían recomendables.
5. Qué joins puede generar Prisma internamente.
6. Qué problemas podrían aparecer con muchas applications/interviews.
7. Cómo diseñar una query eficiente y mantenible.
8. Qué datos NO deberían cargarse innecesariamente.
9. Qué estrategia usarías para evitar overfetching.

Documéntalo en docs/diseno-get.md
```` 
---

# Prompt 7 - Diseño de la implementación

````markdown
En base a todo el análisis previo:

Diseña la implementación ideal para:

GET /positions/:id/candidates

Siguiendo:
- la arquitectura actual del proyecto
- buenas prácticas backend
- separación de capas
- principios SOLID
- Prisma best practices

Quiero que definas:

1. Route.
2. Controller.
3. Service.
4. Query Prisma ideal.
5. DTOs necesarios.
6. Validaciones.
7. Manejo de errores.
8. Response contract.
9. Casos edge.
10. Estrategia de testing.
11. Cómo mantener consistencia con el resto del proyecto.
12. Qué refactors mínimos recomendarías antes de implementarlo.

Documéntalo en docs/diseno-get.md
````

---

# Prompt 8 - Revisión crítica del diseño

`````markdown
Actúa como un Principal Software Engineer realizando una architectural review.

Voy a implementar:

GET /positions/:id/candidates

Este es el diseño propuesto:
````markdown
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
````

Quiero que hagas una revisión crítica profunda y detectes:

1. Problemas de diseño.
2. Inconsistencias con el dominio ATS.
3. Riesgos de escalabilidad.
4. Posibles N+1 queries.
5. Problemas de acoplamiento.
6. Violaciones SOLID.
7. Riesgos de deuda técnica.
8. Problemas REST.
9. Problemas de naming.
10. Riesgos de mantenibilidad.
11. Posibles edge cases olvidados.
12. Qué mejorarías antes de implementarlo.
13. Qué partes del diseño son realmente buenas y deberían mantenerse.

NO seas complaciente.
Quiero una revisión crítica real como en una empresa senior-level.
````` 

---

# Prompt 9 - Alineación del objetivo

`````markdown
Actúa como un Staff Software Engineer pragmático.

Quiero implementar el endpoint:

GET /positions/:id/candidates

Este es el estado REAL del proyecto:
- docs/database.md
- docs/modelos_servicios.md

Y esta es la review arquitectónica:
````markdown
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
| Error handling | ❌ Sin estándar |
| Testabilidad | ⚠️ Coupling alto con Prisma |
| Mantenibilidad | ⚠️ Duplicación de lógica |

**Recomendación**: No merge hasta resolver los items críticos (#1-#3 de sección 12).
````

Necesito que determines:

1. Qué mejoras son REALMENTE necesarias para esta feature.
2. Qué recomendaciones serían overengineering para el estado actual del proyecto.
3. Qué refactors mínimos deberían hacerse antes de implementar.
4. Cómo mantener consistencia con la arquitectura actual.
5. Qué decisiones tomaría un equipo senior pragmático.
6. Qué cosas deberían dejarse para una futura refactorización global.
7. Cuál sería el equilibrio correcto entre:
   - calidad
   - mantenibilidad
   - simplicidad
   - consistencia
   - tiempo de implementación

Quiero una respuesta pragmática y realista, no una arquitectura idealizada enterprise.
`````

# Prompt 10 - Implementación del endpoint GET /positions/:id/candidates

````markdown
Implementa el endpoint:

GET /positions/:id/candidates

Contexto importante del proyecto:
- Backend Express + TypeScript + Prisma.
- Arquitectura actual:
  - routes
  - controllers
  - services
- El proyecto NO usa repository pattern.
- El proyecto NO usa dependency injection.
- PrismaClient actualmente se instancia directamente en services/models.
- El proyecto usa error handling simple con Error genérico.
- Queremos mantener consistencia con el código existente.
- Evitar sobreingeniería.
- Seguir enfoque pragmático.

Requisitos funcionales:
El endpoint debe devolver todos los candidatos asociados a una posición.

Debe devolver:
- candidateId
- candidateName
- currentInterviewStep
- averageScore

El averageScore:
- se calcula usando interviews.score
- debe ignorar scores null
- si no hay scores válidos → devolver null
- redondear a 1 decimal

Buenas prácticas obligatorias:
- evitar N+1 queries
- usar select explícito
- evitar overfetching
- mantener lógica fuera del controller
- validación básica del id
- usar Promise.all si aporta valor
- mantener naming consistente con el proyecto

NO implementar:
- repository layer
- cache
- dependency injection
- error classes enterprise
- arquitectura compleja

Quiero:
1. Código completo del service.
2. Código completo del controller.
3. Código completo de las routes.
4. Cambios necesarios en schema.prisma para índices.
5. Explicación breve de decisiones importantes.
6. Señalar posibles TODOs futuros sin implementarlos ahora.
7. Código listo para producción y consistente con el proyecto actual.
```` 

---

# Prompt 11 - Review del código

```` markdown
Haz una code review senior exhaustiva del código implementado.

Analiza:
- consistencia con arquitectura actual
- bugs potenciales
- edge cases
- Prisma best practices
- overfetching
- posibles N+1
- naming
- legibilidad
- maintainability
- simplicidad vs calidad
- si hay sobreingeniería
- si hay deuda técnica innecesaria

Quiero feedback pragmático y realista como en una Pull Request profesional.

````

---

# Prompt 12 - Aplicar correcciones

````markdown
Aplica las correcciones detectadas en la code review al endpoint:

GET /positions/:id/candidates

Cambios obligatorios:
1. Eliminar PrismaClient del controller.
2. Mover la verificación de Position al service.
3. Mantener toda lógica Prisma únicamente en el service.
4. Mejorar el cálculo de averageScore eliminando magic numbers.
5. Mantener el enfoque pragmático actual.
6. NO introducir:
   - repository pattern
   - dependency injection
   - DTO system complejo
   - error classes enterprise
   - cache
   - sobreingeniería

Quiero:
- código final corregido
- listo para merge
- consistente con la arquitectura actual
- manteniendo simplicidad
- manteniendo buenas prácticas razonables

Además:
- documenta brevemente los edge cases conocidos
- indica qué deuda técnica queda aceptada conscientemente
```` 

---

# Prompt 13 - Generación de tests

````markdown
Genera una checklist profesional de testing manual para validar:

GET /positions/:id/candidates

Incluye:
- happy paths
- ids inválidos
- posición inexistente
- candidatos sin entrevistas
- scores null
- múltiples entrevistas
- candidatos duplicados
- performance básica
- validación del response
- validación de ordenamiento
- validación de averageScore

Quiero casos prácticos para probar en:
- Postman
- curl
- Swagger
```` 

---

# Prompt 14 -  Análisis y Documentación de Decisiones de Diseño de endpoint put

```markdown
Analiza el proyecto para entender el dominio de candidatos y etapas de entrevistas.

Objetivo
Diseñar: PUT /candidates/:id/stage - Actualiza la etapa (currentInterviewStep) de un candidato.

Análisis
1. **Schema (schema.prisma)**:
   - Cómo se relacionan: Candidate, Application, Position, InterviewStep, InterviewFlow
   - Qué representa currentInterviewStep
   - Campos relevantes de InterviewStep
2. **Código existente**:
   - Cómo se accede a las aplicaciones de un candidato
   - Validaciones existentes
   - Manejo de errores

Decisiones a documentar
1. ¿Cómo identificamos qué posición actualizar?
2. ¿Se permite mover a cualquier etapa o solo secuencialmente?
3. ¿Qué validación del nuevo step?
4. ¿Qué devuelve el endpoint?

Formato
Crea `docs/diseno-put.md` con este formato:
```markdown

Decisiones de Diseño - PUT /candidates/:id/stage
- Resumen del Dominio
[Explicación basada en el código]
- Decisión 1: [Título]
  - Problema: ...
  - Evidencia del código: [referencias concretas]
  - Solución: ...
-  Decisión 2: [Título]
...
Incluye referencias al código que sustenta cada decisión.
````

---

# Prompt 15 - Análisis y actualización del documento de diseño

````markdown
Analiza el proyecto para actualizar el documento de decisiones de diseño.

Objetivo
El endpoint solicitado originalmente es:
PUT /candidates/:id/stage (donde :id = candidateId)
El documento actual (docs/diseno-put.md) propone una ruta anidada diferente. Necesita actualizarse a la URL original.

Tarea
1. Revisa docs/diseno-put.md para entender las decisiones actuales
2. Analiza el código existente para determinar qué parámetro es más adecuado para identificar la aplicación:
   - applicationId en el body
   - positionId en el body
3. Justifica basándote en:
   - Relaciones del schema (Candidate, Application, Position)
   - Referencias al código
   - Pros/contras de cada opción

Actualización requerida
Una vez determinado el parámetro adecuado, actualiza docs/diseno-put.md:
- URL: PUT /candidates/:id/stage
- Body: { <parámetroelegido>: number, newStepId: number, notes?: string }
- Mantener las validaciones existentes
- Mantener el formato de respuesta
Modifica las secciones necesarias:
- Decisión 1: Identificación de la Aplicación
- Decisión 3: Validaciones de Negocio  
- Decisión 5: Notas Opcionales
- Contrato Final
- Resumen de decisiones
Incluye referencias al código que sustenta la elección final.
```` 

---

# Prompt 16 - TDD - Test rojos

````markdown
Implementa: PUT /candidates/:candidateId/stage
Consulta las decisiones en docs/diseno-put.md para entender el contrato y docs/arquitectura-backend.md para la arquitectura.
## Tarea
Escribe los tests rojos en Jest ANTES de implementar el código. Ubicación: `backend/src/__tests__/` o crear la carpeta si no existe.

Tests a escribir

- Service Tests
    1. Update exitoso - devuelve aplicación actualizada con todos los campos
    2. Update con notas opcionales (null)
    3. Candidate no existe → throw Error "Candidate not found"
    4. Application no existe → throw Error "Application not found"  
    5. Application no pertenece al candidato → throw Error "Application does not belong to candidate"
    6. Position cerrada (status="Closed") → throw Error "Cannot update stage for closed position"
    7. newStepId no existe → throw Error "Interview step not found"
    8. newStepId no pertenece al interviewFlow de la posición → throw Error "Interview step does not belong to position interview flow"

- Controller Tests (usando supertest o similar si está disponible)
    1. 200 cuando todo válido
    2. 400 cuando position cerrada
    3. 404 cuando candidate/application/step no existe
    4. 403 cuando aplicación no pertenece al candidato
    5. 400 cuando ID inválido (parseInt fails)

Formato
```typescript
describe('updateCandidateStage', () => {
  it('should update stage successfully', async () => { ... });
  it('should throw error when candidate not found', async () => { 
    await expect(...).rejects.toThrow('Candidate not found');
  });
});
Notas
- No implementes el código todavía - solo los tests
- Usa describe/it de Jest
- Mantén los nombres de funciones que usarás luego en la implementación
- No uses mocks
````

---

# Prompt 17 - Implementación mínima (test verde)

````markdown
Los tests ya están escritos. Ahora implementa el código mínimo para que pasen.

Archivos a crear/modificar
1. **Service**: `backend/src/application/services/candidateService.ts`
   - Añadir función: `updateCandidateStage(candidateId: number, applicationId: number, newStepId: number, notes?: string)`
2. **Controller**: `backend/src/presentation/controllers/candidateController.ts`
   - Añadir función: `updateCandidateStage(req, res)`
3. **Route**: `backend/src/routes/candidateRoutes.ts`
   - Añadir: `router.put('/:id/stage', updateCandidateStage)`

Validaciones (según docs/diseno-put.md)
El flujo debe ser:
1. Parsear candidateId de params
2. Parsear applicationId, newStepId, notes del body
3. Validar IDs con parseInt + isNaN
4. Verificar application existe y pertenece al candidato
5. Verificar position.status != "Closed"
6. Verificar newStepId existe
7. Verificar newStepId.interviewFlowId == position.interviewFlowId
8. Actualizar currentInterviewStep y optionalmente notes

Response 200 esperado
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
Notas
- NO hace falta optimize - solo lo necesario para que pasen los tests
- Mantén el estilo del proyecto (error handling simple, sin sobreingeniería)
- Imports desde las capas correctas como se muestra en docs/arquitectura-backend.md
- No uses mocks

```` 

---

# Prompt 18 - Refactor

````markdown
Los tests ya pasan. Ahora mejora el código sin cambiar funcionalidad.

Área de mejora
1. **PrismaClient**: Si creaste una nueva instancia, refactoriza para importar de donde ya existe (evitar múltiples instancias)
2. **Magic numbers**: Si hay hardcoded valores (ej: 10 para decimales), extraer a constantes con nombres descriptivos
3. **Duplicación**: Si hay código repetido entre funciones similares, extraer a funciones reutilizables
4. **Validación**: Asegurar que parseInt/isNaN está bien manejado en todos los paths
5. **Edge cases**: Verificar que no haya null pointer errors o casos no cubiertos

Lo que NO debes hacer (mantener)
- Repository pattern
- Dependency injection
- DTOs complejos
- Clases de error enterprise
- Cache

Verificación
- Todos los tests siguen pasando
- El código es más limpio que antes
- Mantiene consistencia con el proyecto
```` 

---

# Prompt 19 - Review del código

```` markdown
Haz una code review senior exhaustiva del código implementado.

Analiza:
- consistencia con arquitectura actual
- bugs potenciales
- edge cases
- Prisma best practices
- overfetching
- posibles N+1
- naming
- legibilidad
- maintainability
- simplicidad vs calidad
- si hay sobreingeniería
- si hay deuda técnica innecesaria

Quiero feedback pragmático y realista como en una Pull Request profesional.

````

---

# Prompt 20 - Aplicar correcciones

````markdown
Aplica las correcciones detectadas en la code review al endpoint:

PUT /candidates/:id/stage

Cambios obligatorios:
1. N+1 → reducir a 2-3 queries
2. Duplicación → mover constantes a un shared file
5. Mantener el enfoque pragmático actual.
6. NO introducir:
   - repository pattern
   - dependency injection
   - DTO system complejo
   - error classes enterprise
   - cache
   - sobreingeniería

Quiero:
- código final corregido
- listo para merge
- consistente con la arquitectura actual
- manteniendo simplicidad
- manteniendo buenas prácticas razonables

Verifica:
- Todos los tests siguen pasando
- El código es más limpio que antes
- Mantiene consistencia con el proyecto

Además:
- documenta brevemente los edge cases conocidos
- indica qué deuda técnica queda aceptada conscientemente
```` 

---

# Prompt 21 - Corrección indicada en pr
````markdown
In `@backend/prisma/migrations/20260518174916_20260518194900_sql/migration.sql`:
- Around line 2-8: The migration contains blocking CREATE INDEX statements
(Application_positionId_idx, Application_candidateId_idx,
Interview_applicationId_idx) which will block writes; because the project is on
Prisma v5.13.0 (which cannot emit CREATE INDEX CONCURRENTLY), either upgrade
Prisma to v7.4.0+ and regenerate the migration so the generated SQL uses CREATE
INDEX CONCURRENTLY for those indexes, or remove those CREATE INDEX lines from
this migration and apply the indexes out-of-band (run CREATE INDEX CONCURRENTLY
manually during a maintenance window or via a separate deployment script) and
document/schedule the maintenance window to avoid write-blocking.
````

---

# Prompt 22 - Corrección indicada en pr
````markdown
In `@backend/src/__tests__/updateCandidateStage.test.ts`:
- Around line 1-33: The tests are brittle because they use hard-coded DB IDs;
change the spec to create deterministic fixtures at test setup (create a
Candidate, Application, and InterviewStep via your repositories or factories and
capture their IDs) and use those IDs in updateCandidateStage calls, then clean
up or wrap each test in a transaction/rollback to reset state; additionally, in
the controller tests replace direct DB calls by mocking updateCandidateStage
when testing updateCandidateStageController so the controller tests only assert
HTTP mapping and error handling, referencing the updateCandidateStage function
and updateCandidateStageController to locate where to apply mocks and fixture
usage.
````

---

# Prompt 23 - Corrección indicada en pr
````markdown
In `@backend/src/application/services/candidateService.ts`:
- Around line 91-113: In updateCandidateStage, add an upfront existence check
for the candidate (use prisma.candidate.findUnique({ where: { id: candidateId }
})) and if missing throw the dedicated STAGE_ERRORS.CANDIDATE_NOT_FOUND error
before loading the application and performing the ownership check; ensure this
candidate lookup occurs prior to the application.candidateId !== candidateId
comparison so nonexistent candidates return the not-found error instead of the
app-belongs error.
````

---

# Prompt 24 - Corrección indicada en pr
````markdown
In `@backend/src/application/services/candidateService.ts`:
- Line 156: The update currently sets updatedAt: new Date() (in
candidateService.ts) which can drift from the DB timestamp; instead use the
timestamp returned by the persistence layer—remove or stop setting updatedAt
client-side in the updateCandidate (or equivalent) flow and read the persisted
updatedAt from the repository/ORM update result (e.g., use the object returned
by candidateRepository.update/candidateRepository.save or the DB returning
clause and assign result.updatedAt to the response). Ensure the service returns
that persisted updatedAt rather than a newly constructed Date().
````

---

# Prompt 25 - Corrección indicada en pr
````markdown
In `@backend/src/presentation/controllers/candidateController.ts`:
- Around line 46-64: The current parseInt usage in candidateController.ts
(variables candidateId/candidateIdParam, applicationId, newStepId and type
UpdateStageBody) allows partial numeric strings like "12abc"; replace those
parseInt checks with strict positive-integer validation by ensuring the raw
string matches /^\d+$/ (or use Number.isInteger after converting) before
converting to a Number and checking > 0, then proceed with existing error
responses (HTTP_STATUS.BAD_REQUEST) when validation fails; update the code paths
that produce candidateId, applicationId and newStepId so they only accept fully
numeric, positive integers and convert to numeric type after the regex/integer
check.
````

---

# Prompt 26 - Pasar de test manuales a test jest
````markdown
Al pasar los test de @docs/testing-checklist.md se ha visto que no está pasando las rutas al controlador para IDs no numéricos porque el patrón :id acepta cualquier cosa y Express intenta buscar la ruta.
Añade esta validación más estricta en las rutas para que cumpla con lo indicado en los tests.
Además quiero que pases de @docs/testing-checklist.md a test de jest sin inventar nada nuevo, simplemente transformando lo indicicado en @docs/testing-checklist.md .
Indica qué cambios has hecho y cualquier problema que te encuentres
````

---

# Prompt 27 - Corrección indicada en pr
````markdown

````

---

# Prompt 28 - Corrección indicada en pr
````markdown

````

---

# Prompt 25 - Corrección indicada en pr
````markdown

````

---

# Prompt 25 - Corrección indicada en pr
````markdown

````
