# Modelos, Servicios y Controladores - Análisis y Guía

## 1. Patrón Arquitectónico

El proyecto utiliza una **arquitectura híbrida de tres capas con patrones de Active Record**:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│  routes/ (candidateRoutes.ts) → HTTP routing                       │
│  presentation/controllers/ (candidateController.ts) → Request/Response│
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                           │
│  application/services/ (candidateService.ts) → Lógica de negocio   │
│  application/validator.ts → Validación de datos                     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DOMAIN LAYER                              │
│  domain/models/ (Candidate.ts) → Modelos con lógica de acceso a BD  │
│                              (Patrón Active Record)                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Característica clave**: El modelo `Candidate.ts` combina:
- **Active Record**: Los modelos tienen métodos `save()`, `findOne()` que interactúan directamente con Prisma

---

## 2. Queries Prisma en el Proyecto

### Patrón actual: Queries en métodos estáticos del modelo

```typescript
// Candidate.ts:94-116
static async findOne(id: number): Promise<Candidate | null> {
    const data = await prisma.candidate.findUnique({
        where: { id: id },
        include: {
            educations: true,
            workExperiences: true,
            resumes: true,
            applications: {
                include: {
                    position: {
                        select: { id: true, title: true }
                    },
                    interviews: {
                        select: {
                            interviewDate: true,
                            interviewStep: {
                                select: { name: true }
                            },
                            notes: true,
                            score: true
                        }
                    }
                }
            }
        }
    });
    if (!data) return null;
    return new Candidate(data);
}
```

### Estructura de las queries:

1. **Sin await directo en el modelo para writes**: Usan `try/catch` interno
2. **Con await directo en métodos estáticos de lectura**: `findUnique`, `findMany`
3. **Creación con `create` y nested writes**: Usan `data: { ... create: [...] }`
4. **Actualización con `update`**: Usan `where + data`

---

## 3. Lógica de Negocio

**Ubicación actual**: Repartida en dos lugares (PROBLEMA):

| Ubicación | Qué contiene | Problema |
|-----------|--------------|----------|
| `domain/models/Candidate.ts` | Lógica de persistencia, validación de errores Prisma | Mezcla modelo con acceso a datos |
| `application/services/candidateService.ts` | Validación, coordinación de guardado, manejo de errores | Llama a `save()` del modelo para cada relación |

### Ejemplo de lógica repartida (duplicación):

```typescript
// candidateService.ts:40-45 - GUARDA CV SEPARADAMENTE
if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
    const resumeModel = new Resume(candidateData.cv);
    resumeModel.candidateId = candidateId;
    await resumeModel.save();
}

// Candidate.ts:70-77 - PERO YA LO HACE EN EL save() PRINCIPAL
if (this.resumes.length > 0) {
    candidateData.resumes = {
        create: this.resumes.map(resume => ({...}))
    };
}
```

**Problema**: El CV se guarda dos veces en la BD en diferentes flows.

---

## 4. Manejo de Errores

### Estrategia actual:

| Capa | Estrategia | Ejemplo |
|------|------------|---------|
| **Modelo** | `try/catch` interno, lanza `Error` genérico | `throw new Error('msg')` |
| **Service** | `try/catch` parcial, detecta códigos Prisma (`P2002`, `P2025`) | `if (error.code === 'P2002')` |
| **Controller** | `try/catch`, distingue `Error` vs `unknown` | `if (error instanceof Error)` |
| **Routes** | Duplicación del manejo del controller | `if (error instanceof Error)` |

### Códigos Prisma manejados:

```typescript
// P2002: Unique constraint failed
if (error.code === 'P2002') {
    throw new Error('The email already exists in the database');
}

// P2025: Record not found
if (error.code === 'P2025') {
    throw new Error('No se pudo encontrar el registro...');
}
```

### **MALAS PRÁCTICAS detectadas**:

1. **Duplicación en routes**: `candidateRoutes.ts:6-17` re-implementa el mismo manejo que `candidateController.ts:4-16`
2. **`console.log` en lugar de logging estructurado**: `Candidate.ts:100`, `candidateService.ts:62`
3. **Lanzar `Error` genérico**: No hay clases de error personalizadas
4. **Sin errores 500 en controller**: `getCandidateById` returns 500 sin mensaje específico

---

## 5. Includes y Relations

### Patrón actual: `include` anidado con `select` para optimización

```typescript
// Candidate.ts:132-158
include: {
    educations: true,              // Incluir todo
    workExperiences: true,         // Incluir todo
    resumes: true,                 // Incluir todo
    applications: {
        include: {
            position: {
                select: { id: true, title: true }  // Solo campos necesarios
            },
            interviews: {
                select: {                              // Filtrar campos sensibles
                    interviewDate: true,
                    interviewStep: { select: { name: true } },
                    notes: true,
                    score: true
                    // Excluye: result, employeeId, applicationId
                }
            }
        }
    }
}
```

### Reglas observadas:
- `true` para relaciones simples que se necesitan completas
- `select` con campos específicos para evitar exponer datos sensibles
- **Jerarquía limitada**: Máximo 2 niveles de `include` anidado

---

## 6. Estructura del Proyecto

```text
backend/src/
├── application/
│   ├── services/
│   │   └── candidateService.ts    # Lógica de negocio + coordinación
│   └── validator.ts                # Validación de entrada
├── domain/
│   └── models/
│       ├── Candidate.ts           # Modelo + acceso a BD
│       ├── Education.ts
│       ├── WorkExperience.ts
│       └── ...
├── presentation/
│   └── controllers/
│       └── candidateController.ts  # Adaptador HTTP
└── routes/
    └── candidateRoutes.ts         # Definición de rutas
```

### Convenciones de nombres:

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Modelos | PascalCase, singular | `Candidate`, `WorkExperience` |
| Services | camelCase, nombre descriptivo | `addCandidate`, `findCandidateById` |
| Controllers | Nombre del modelo + "Controller" | `getCandidateById` |
| Routes | Nombre del recurso en plural | `/candidates` → `/candidates/:id` |
| Métodos Service | verbo + recurso | `addCandidate`, `updateCandidate` |
| Métodos Modelo | CRUD genéricos | `save()`, `findOne()`, `delete()` |

---

## 7. Convenciones a Seguir

### Para mantener consistencia:

1. **Imports**: Usar rutas relativas desde la capa actual
   ```typescript
   import { Candidate } from '../../domain/models/Candidate';
   ```

2. **Parámetros en services**: Actualmente se usa `any` para datos de entrada (validación luego), aunque DTOs tipados son preferibles.

3. **Retorno de métodos**: Los métodos estáticos en modelos devuelven instancias del modelo o `null`

4. **try/catch en services**: Siempre capturar y relanzar con mensaje de negocio

5. **HTTP status codes**:
   - `201` para creación exitosa
   - `200` para lectura/actualización exitosa
   - `400` para errores de validación
   - `404` para no encontrado
   - `500` para errores internos

6. **Nomenclatura de archivos**: Un archivo por clase/entity

7. **Validación**: Módulos separados en `validator.ts`, funciones exportables

---

## 8. Malas Prácticas a EVITAR

### ❌ NO hacer esto:

| Malpractice | Ubicación actual | Por qué es malo |
|------------|------------------|-----------------|
| **Instanciar PrismaClient en cada modelo** | `Candidate.ts:7` | Consume conexiones, debe ser singleton |
| **Duplicar lógica en routes** | `candidateRoutes.ts:6-17` | Violación DRY, inconsistencia |
| **console.log en producción** | Múltiples archivos | Sin niveles de log, difícil auditoría |
| **Guardar relaciones una por una** | `candidateService.ts:20-45` | N+1 queries, ineficiente |
| **Sin tipado en DTOs** | `candidateData: any` | Propenso a errores en runtime |
| **Mezclar validación en modelo** | `Candidate.ts:34-127` | El modelo hace demasiado |
| **Sin transacción para writes múltiples** | `candidateService.ts` | Datos inconsistentes si falla parcial |
| **Error genérico `throw new Error()`** | Todo el proyecto | Sin stack trace útil, sin código de error |
| **Validación duplicada** | `validator.ts:81-84` | Retorna `undefined` si hay `id` |

---

## 9. Cómo Implementar un Endpoint de Lectura Complejo

### Guía paso a paso con mejor práctica:

### Paso 1: Definir en el modelo (opcional - para queries reusable)

Si la query es reusable, añadir método estático:

```typescript
// domain/models/Candidate.ts
static async findWithApplications(filters: {
    status?: string;
    positionId?: number;
    minScore?: number;
}): Promise<Candidate[]> {
    return await prisma.candidate.findMany({
        where: {
            applications: filters.positionId ? {
                some: { positionId: filters.positionId }
            } : undefined
        },
        include: {
            educations: true,
            workExperiences: true,
            applications: {
                where: filters.status ? { position: { status: filters.status } } : undefined,
                include: {
                    position: { select: { id: true, title: true, location: true } },
                    interviews: filters.minScore ? {
                        where: { score: { gte: filters.minScore } }
                    } : undefined
                }
            }
        }
    });
}
```

### Paso 2: Crear el service

```typescript
// application/services/candidateService.ts
export const findCandidatesWithFilters = async (filters: {
    status?: string;
    positionId?: number;
    minScore?: number;
}): Promise<Candidate[]> => {
    try {
        const candidates = await Candidate.findWithApplications(filters);
        return candidates;
    } catch (error: any) {
        console.error('Error searching candidates:', error);
        throw new Error('Error al buscar candidatos');
    }
};
```

### Paso 3: Crear el controller

```typescript
// presentation/controllers/candidateController.ts
export const searchCandidates = async (req: Request, res: Response) => {
    try {
        const { status, positionId, minScore } = req.query;

        const filters: any = {};
        if (status) filters.status = status as string;
        if (positionId) filters.positionId = parseInt(positionId as string);
        if (minScore) filters.minScore = parseInt(minScore as string);

        const candidates = await findCandidatesWithFilters(filters);

        if (candidates.length === 0) {
            return res.status(200).json({ message: 'No candidates found', data: [] });
        }

        res.json({ data: candidates });
    } catch (error) {
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};
```

### Paso 4: Crear la ruta

```typescript
// routes/candidateRoutes.ts
import { Router } from 'express';
import { searchCandidates, getCandidateById } from '../presentation/controllers/candidateController';

const router = Router();

router.get('/search', searchCandidates);
router.get('/:id', getCandidateById);

export default router;
```

### Mejoras sobre el estilo actual:

| Aspecto | Estilo actual | Mejora recomendada |
|---------|---------------|-------------------|
| **PrismaClient** | Instanciado en cada modelo | Singleton en archivo separado `prisma.ts` |
| **Transacciones** | No hay | Usar `prisma.$transaction` para writes |
| **Tipado** | `any` | DTOs con interfaces tipadas |
| **Logging** | `console.log` | Winston o similar |
| **Errores** | `Error` genérico | Clases de error personalizadas |
| **Validación** | Módulo separado | Considerar Zod para validación de runtime |
| **DRY routes** | Duplicación | Controller directo en routes |

---

## Resumen de Implementación Recomendada

```text
┌──────────────────────────────────────────────────────────────┐
│  routes/candidateRoutes.ts                                  │
│    → GET /search  → controller                               │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  presentation/controllers/candidateController.ts            │
│    → parseQuery(), call service, format response             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  application/services/candidateService.ts                    │
│    → business logic, error handling, orchestration           │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  domain/models/Candidate.ts                                  │
│    → static methods for reusable queries                     │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│  prisma.ts (singleton) → PrismaClient                        │
└──────────────────────────────────────────────────────────────┘
```

---

*Documento actualizado el 17 de Mayo de 2026*
*Análisis basado en: Candidate.ts, candidateService.ts, candidateController.ts, candidateRoutes.ts*