# Modelos, Servicios y Controladores - Análisis y Guía de Estilo

> Análisis exhaustivo del proyecto LTI Talent Tracking System

---

## 1. Patrón Arquitectónico Real

El proyecto utiliza una **arquitectura híbrida de tres capas con patrón Active Record**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│  routes/ (candidateRoutes.ts)          → HTTP routing + errores   │
│  presentation/controllers/            → Request → Response adapter│
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                           │
│  application/services/                → Lógica de negocio          │
│  application/validator.ts            → Validación de entrada      │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DOMAIN LAYER                              │
│  domain/models/ (Candidate.ts)       → Modelos + persistencia      │
│                                       → Patrón Active Record       │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      INFRASTRUCTURE LAYER                         │
│  Prisma Client (instanciado en cada modelo)                       │
│  PostgreSQL                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Características Clave del Patrón Implementado

| Característica | Implementación | Evidencia |
|---------------|----------------|-----------|
| **Active Record** | Los modelos tienen métodos `save()`, `findOne()` que interactúan con Prisma | `Candidate.ts:34-127` |
| **Sin Repository** | No hay capa de abstracción de BD separada | Directo en modelos |
| **Capas definidas** | Presentation → Application → Domain | Estructura de carpetas |
| **Mezcla de responsabilidades** | Los modelos hacen too much (persist + validación de errores) | `Candidate.ts` |

---

## 2. Cómo se Construyen las Queries Prisma

### 2.1 Queries de Lectura (Métodos Estáticos en Modelos)

```typescript
// Candidate.ts:129-162 - Patrón de lectura con include
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

### 2.2 Queries de Escritura (save() con lógica condicional)

```typescript
// Candidate.ts:34-127 - Patrón de escritura con nested writes
async save() {
    const candidateData: any = {};

    // Solo campos no undefined
    if (this.firstName !== undefined) candidateData.firstName = this.firstName;
    if (this.lastName !== undefined) candidateData.lastName = this.lastName;

    // Nested writes para relaciones
    if (this.education.length > 0) {
        candidateData.educations = {
            create: this.education.map(edu => ({...}))
        };
    }

    if (this.id) {
        return await prisma.candidate.update({
            where: { id: this.id },
            data: candidateData
        });
    } else {
        return await prisma.candidate.create({
            data: candidateData
        });
    }
}
```

### 2.3 Estructura de Queries Observadas

| Tipo | Patrón | Ejemplo |
|------|--------|---------|
| **findUnique** | `where` con PK + `include` opcional | `Candidate.findOne()` |
| **create** | `data` con nested writes | `save()` crear |
| **update** | `where` + `data` | `save()` actualizar |
| **findMany** | `where` + `include` + `orderBy` | No usado actualmente |
| **include** | Anidado con `select` para optimización | `findOne()` línea 132-158 |

### 2.4 Manejo de Errores Prisma en Queries

```typescript
// Candidate.ts:94-126
try {
    return await prisma.candidate.update({...});
} catch (error: any) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error('No se pudo conectar con la base de datos...');
    } else if (error.code === 'P2025') {
        throw new Error('No se pudo encontrar el registro...');
    } else {
        throw error;
    }
}
```

---

## 3. Dónde se Coloca la Lógica de Negocio

### 3.1 Repartida en Dos Capas (PROBLEMA IDENTIFICADO)

| Ubicación | Qué hace | Líneas |
|-----------|----------|--------|
| `domain/models/Candidate.ts` | Persistencia, manejo errores Prisma, nested writes | 34-127 |
| `application/services/candidateService.ts` | Validación entrada, coordinación guardado, manejo errores de negocio | 7-55 |

### 3.2 Ejemplo de Lógica Duplicada

```typescript
// candidateService.ts:40-45 - GUARDA CV POR SEPARADO
if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
    const resumeModel = new Resume(candidateData.cv);
    resumeModel.candidateId = candidateId;
    await resumeModel.save();  // ← Guardado individual
}

// PERO en Candidate.ts:70-77 YA LO HACE EN EL NESTED WRITE PRINCIPAL
if (this.resumes.length > 0) {
    candidateData.resumes = {
        create: this.resumes.map(resume => ({...}))
    };
}
```

**Problema**: El CV se intenta guardar dos veces si viene en `candidateData.cv`.

### 3.3 Flujo de Lógica para POST /candidates

```
Routes: req.body → controller
    ↓
Service: validateCandidateData() → crear instancia Candidate
    ↓
Model: candidate.save() → prisma.candidate.create() + nested writes
    ↓
Service: guardar education/WorkExperience/Resume uno por uno (N+1!)
    ↓
Service: return savedCandidate
    ↓
Controller: res.status(201).json(...)
```

---

## 4. Cómo Manejan Errores

### 4.1 Estrategia por Capa

| Capa | Estrategia | Ejemplo |
|------|------------|---------|
| **Modelo** | try/catch interno, lanza Error genérico | `Candidate.ts:100-109` |
| **Service** | try/catch parcial, detecta códigos Prisma (P2002, P2025) | `candidateService.ts:48-53` |
| **Controller** | try/catch, distingue Error vs unknown | `candidateController.ts:9-14` |
| **Routes** | DUPLICACIÓN del manejo del controller | `candidateRoutes.ts:11-17` |

### 4.2 Códigos Prisma Manejados

```typescript
// Error de unique constraint
if (error.code === 'P2002') {
    throw new Error('The email already exists in the database');
}

// Error de registro no encontrado
if (error.code === 'P2025') {
    throw new Error('No se pudo encontrar el registro...');
}

// Error de conexión
if (error instanceof Prisma.PrismaClientInitializationError) {
    throw new Error('No se pudo conectar con la base de datos...');
}
```

### 4.3 Malas Prácticas en Manejo de Errores

| Problema | Ubicación | Impacto |
|----------|-----------|---------|
| **Duplicación routes/controller** | `candidateRoutes.ts:6-17` Y `candidateController.ts:4-16` | Inconsistencia, DRY violado |
| **console.log en lugar de logger** | `Candidate.ts:100`, `candidateService.ts:62` | Sin niveles, difícil auditoría |
| **Error genérico thrown** | Todo el proyecto | Sin stack trace útil, sin código |
| **Sin mensaje en 500** | `candidateController.ts:30` | Dificulta debugging |
| **catch sin tipado** | `candidateService.ts:10` | `error: any` obscures类型 |

---

## 5. Cómo Manejan Includes/Relations

### 5.1 Patrón: include con select anidado

```typescript
// Candidate.ts:132-158
include: {
    educations: true,              // ← Incluir todo
    workExperiences: true,        // ← Incluir todo
    resumes: true,                 // ← Incluir todo
    applications: {
        include: {
            position: {
                select: { id: true, title: true }  // ← Solo campos específicos
            },
            interviews: {
                select: {                              // ← Filtrar campos sensibles
                    interviewDate: true,
                    interviewStep: {
                        select: { name: true }
                    },
                    notes: true,
                    score: true
                    // Excluye: result, employeeId, applicationId
                }
            }
        }
    }
}
```

### 5.2 Reglas Observadas

| Patrón | Uso | Ejemplo |
|--------|-----|---------|
| `include: true` | Relaciones simples que se necesitan completas | `educations`, `workExperiences` |
| `include + select` | Evitar exponer datos sensibles | `interviews` sin `employeeId` |
| `select` anidado | Limitar profundidad | `position.title` |
| Jerarquía limitada | Máximo 2 niveles de include | Solo 2 niveles |

### 5.3 Problema: select en array no incluido

```typescript
// ERROR COMÚN: Select en relación no incluida
{
    include: {
        // Falta interviews
    },
    select: {
        // Esto no funciona si interviews no está en include
    }
}

// CORRECTO:
{
    include: {
        interviews: { select: {...} }  // Include + select juntos
    }
}
```

---

## 6. Estructura de Controllers/Services/Models

### 6.1 Estructura de Archivos

```
backend/src/
├── index.ts                           # Entry point Express
├── application/
│   ├── services/
│   │   └── candidateService.ts        # Lógica de negocio
│   └── validator.ts                   # Validación entrada
├── domain/
│   └── models/
│       ├── Candidate.ts              # Modelo + persistencia
│       ├── Education.ts
│       ├── WorkExperience.ts
│       ├── Resume.ts
│       └── ...
├── presentation/
│   └── controllers/
│       └── candidateController.ts    # Adaptador HTTP
└── routes/
    └── candidateRoutes.ts            # Definición rutas
```

### 6.2 Responsabilidades por Capa

**Routes** (`candidateRoutes.ts:6-18`):
- Define endpoints HTTP
- Maneja parsing de body
- Re-dice manejo de errores (DUPLICADO)

**Controller** (`candidateController.ts:4-32`):
- Extrae parámetros de Request
- Valida formato de IDs (`parseInt`, `isNaN`)
- Llama al service
- Convierte errores a respuestas HTTP

**Service** (`candidateService.ts:7-55`):
- Valida datos de entrada (`validateCandidateData`)
- Orchestrates domain operations
- Maneja errores de negocio
- Retorna datos o lanza errores

**Model** (`Candidate.ts`):
- Constructor con datos
- Métodos CRUD (`save()`, `findOne()`)
- Lógica de mapeo a schema Prisma
- Manejo de errores Prisma

---

## 7. Convenciones a Seguir para Consistencia

### 7.1 Naming Conventions

| Elemento | Convención | Ejemplo |
|----------|------------|---------|
| Modelos | PascalCase, singular | `Candidate`, `WorkExperience` |
| Archivos modelo | PascalCase.ts | `Candidate.ts` |
| Services | camelCase, verbo + recurso | `addCandidate`, `findCandidateById` |
| Controllers | prefijo recurso + Controller | `getCandidateById`, `addCandidateController` |
| Routes | Plural del recurso | `/candidates`, `/candidates/:id` |
| Métodos modelo | `save()`, `findOne()`, `delete()` | Genéricos |
| Métodos service | `verboRecurso` | `updateCandidateStage` |

### 7.2 Import Conventions

```typescript
// Desde service: relative path desde application/services/
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';

// Desde controller: relative path desde presentation/controllers/
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
```

### 7.3 Parámetros y Tipado

```typescript
// Service: usar any para datos de entrada (validación después)
export const addCandidate = async (candidateData: any) => { ... }

// Controller: parseo explícito de tipos
const id = parseInt(req.params.id);
if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID format' });
}
```

### 7.4 HTTP Status Codes

| Status | Uso | Ejemplo en proyecto |
|--------|-----|---------------------|
| `201` | Creación exitosa | `candidateController.ts:8` |
| `200` | Lectura/actualización exitosa | `getCandidateById:28` |
| `400` | Error validación | `candidateController.ts:11` |
| `404` | No encontrado | `candidateController.ts:26` |
| `500` | Error interno | `candidateController.ts:30` |

---

## 8. Malas Prácticas que NO Debo Replicar

### ⚠️ EVITAR ESTAS PRÁCTICAS

| # | Mala Práctica | Ubicación Actual | Por qué es Mala | Alternativa |
|---|--------------|------------------|-----------------|--------------|
| **1** | PrismaClient instanciado en cada modelo | `Candidate.ts:7` | Consume conexiones del pool, debe ser singleton | Instancia única en `src/prisma.ts` |
| **2** | Duplicar manejo errores en routes | `candidateRoutes.ts:6-17` | Violación DRY, inconsistencia | Unificar en controller |
| **3** | console.log en producción | `Candidate.ts:100`, `candidateService.ts:62` | Sin niveles, difícil auditoría | Winston/Pino |
| **4** | Guardar relaciones una por uno (N+1) | `candidateService.ts:20-45` | Ineficiente con muchos datos | Nested writes |
| **5** | Sin tipado en DTOs | `candidateData: any` | Propenso a errores runtime | Interfaces/Types |
| **6** | Mezclar validación y modelo | `Candidate.ts:34-127` | El modelo hace demasiado | Separar concerns |
| **7** | Sin transacción para writes múltiples | `candidateService.ts` | Datos inconsistentes si falla parcial | `prisma.$transaction` |
| **8** | Error genérico thrown | Todo el proyecto | Sin stack trace útil, sin código | Clases error personalizadas |
| **9** | Validación retorna undefined | `validator.ts:81-84` | Comportamiento confuso | Lanzar Error explícito |
| **10** | catch sin tipado | `candidateService.ts:10` | `error: any` obscura el tipo | `error: unknown` |

### Ejemplo del Problema #1 (Singleton)

```typescript
// ❌ MAL: Cada modelo crea su propio PrismaClient
// Candidate.ts:7
const prisma = new PrismaClient();

// Education.ts:3
const prisma = new PrismaClient();  // Otra instancia!

// ✅ BIEN: Singleton compartido
// src/prisma.ts
import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();
export default prisma;
```

### Ejemplo del Problema #7 (Transacciones)

```typescript
// ❌ MAL: Sin transacción - si falla en Education, WorkExperience ya guardado
if (candidateData.educations) {
    for (const education of candidateData.educations) {
        const educationModel = new Education(education);
        await educationModel.save();
    }
}

// ✅ BIEN: Transacción atómica
await prisma.$transaction(async (tx) => {
    const candidate = await tx.candidate.create({ data: candidateData });
    if (candidateData.educations) {
        await tx.education.createMany({
            data: candidateData.educations.map(e => ({...e, candidateId: candidate.id}))
        });
    }
    return candidate;
});
```

---

## 9. Cómo Implementar un Nuevo Endpoint de Lectura Complejo

### Caso: GET /positions/:id/candidates

Siguiendo el estilo actual pero mejorando las prácticas:

### Paso 1: Añadir método en el modelo (si es reusable)

```typescript
// domain/models/Position.ts - NUEVO
static async findWithCandidates(positionId: number) {
    const data = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            company: { select: { id: true, name: true } },
            interviewFlow: { select: { id: true, description: true } },
            applications: {
                include: {
                    candidate: {
                        include: {
                            educations: { take: 3 },  // Limitar
                            workExperiences: { take: 3 },
                            resumes: { take: 1 }
                        }
                    },
                    interviewStep: true,
                    interviews: {
                        include: {
                            employee: { select: { name: true } },
                            interviewStep: { select: { name: true } }
                        },
                        orderBy: { interviewDate: 'desc' }
                    }
                },
                orderBy: { applicationDate: 'desc' }
            }
        }
    });
    return data;
}
```

### Paso 2: Crear el service

```typescript
// application/services/positionService.ts - NUEVO
import { Position } from '../../domain/models/Position';

export const getCandidatesByPosition = async (positionId: number) => {
    try {
        const position = await Position.findWithCandidates(positionId);
        
        if (!position) {
            throw new Error('Position not found');
        }

        // Enriquecer con puntuación media
        const enrichedCandidates = position.applications.map(app => {
            const scored = app.interviews.filter(i => i.score !== null);
            const avg = scored.length > 0
                ? scored.reduce((sum, i) => sum + i.score!, 0) / scored.length
                : null;

            return {
                ...app,
                averageScore: avg ? Math.round(avg * 100) / 100 : null
            };
        });

        return {
            position: {
                id: position.id,
                title: position.title,
                status: position.status,
                company: position.company,
                interviewFlow: position.interviewFlow
            },
            candidates: enrichedCandidates
        };
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error('Error fetching candidates:', error.message);
            throw new Error('Error al obtener candidatos de la posición');
        }
        throw error;
    }
};
```

### Paso 3: Crear el controller

```typescript
// presentation/controllers/positionController.ts - NUEVO
import { Request, Response } from 'express';
import { getCandidatesByPosition } from '../../application/services/positionService';

export const getPositionCandidates = async (req: Request, res: Response) => {
    try {
        const positionId = parseInt(req.params.id);
        
        if (isNaN(positionId)) {
            return res.status(400).json({ error: 'Invalid position ID format' });
        }

        const result = await getCandidatesByPosition(positionId);

        res.json(result);
    } catch (error: unknown) {
        if (error instanceof Error) {
            if (error.message === 'Position not found') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        res.status(500).json({ error: 'Unknown error' });
    }
};
```

### Paso 4: Crear la ruta

```typescript
// routes/positionRoutes.ts - NUEVO
import { Router } from 'express';
import { getPositionCandidates } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getPositionCandidates);

export default router;
```

### Paso 5: Registrar en index.ts

```typescript
// src/index.ts
import positionRoutes from './routes/positionRoutes';

app.use('/positions', positionRoutes);
```

---

## 10. Mejoras Recomendadas sobre el Estilo Actual

| Aspecto | Estilo Actual | Mejora Recomendada |
|---------|---------------|-------------------|
| **PrismaClient** | Instanciado en cada modelo (`new PrismaClient()`) | Singleton en `src/prisma.ts` |
| **Transacciones** | No hay para writes múltiples | `prisma.$transaction()` |
| **Tipado** | `any` en todo | Interfaces para DTOs |
| **Logging** | `console.log`, `console.error` | Winston/Pino con niveles |
| **Errores** | `throw new Error()` genérico | Clases error personalizadas |
| **Validación** | Módulo validator.ts básico | Zod para validación runtime |
| **DRY** | Duplicación routes/controller | Controller solo en routes |
| **N+1** | Guardados uno por uno en loop | Nested writes o `$transaction` |

---

## 11. Resumen Visual del Flujo

```
HTTP Request
    │
    ▼
┌─────────────────────────────────────┐
│  routes/candidateRoutes.ts          │
│  - Define endpoints                 │
│  - Parsea body                      │
│  - Duplica manejo errores ⚠️        │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  candidateController.ts             │
│  - parseInt(id)                     │
│  - Valida formato                   │
│  - Llama service                    │
│  - Respone HTTP                     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  candidateService.ts                │
│  - validateCandidateData()          │
│  - Orchestration                    │
│  - Error handling                   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  Candidate.ts (Modelo)              │
│  - new Candidate(data)              │
│  - save() → prisma.candidate.create │
│  - findOne() → prisma.findUnique    │
│  - Manejo errores Prisma            │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│  PostgreSQL via Prisma              │
└─────────────────────────────────────┘
```

---

*Documento actualizado el 17 de Mayo de 2026*
*Análisis basado en: Candidate.ts, candidateService.ts, candidateController.ts, candidateRoutes.ts*