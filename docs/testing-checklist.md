# Testing Checklist: GET /positions/:id/candidates

## Endpoints

```
GET /positions/:id/candidates
Base URL: http://localhost:3010
```

---

## 1. Happy Paths

### 1.1 Posición con candidatos y entrevistas con scores

```bash
# curl
curl -X GET "http://localhost:3010/positions/1/candidates" -H "Content-Type: application/json"
```

**Validar:**
- [ ] Status `200 OK`
- [ ] `positionId` = 1
- [ ] `positionTitle` presente y no vacío
- [ ] `candidates` es array con elementos
- [ ] Cada elemento tiene: `candidateId`, `candidateName`, `currentInterviewStep`, `averageScore`
- [ ] `averageScore` es número entre 0-10

**Postman:** `GET /positions/1/candidates`
**Swagger:** `GET /positions/{id}/candidates` → id: 1

---

### 1.2 Posición sin candidatos

```bash
# curl
curl -X GET "http://localhost:3010/positions/2/candidates"
```

**Validar:**
- [ ] Status `200 OK`
- [ ] `candidates: []`
- [ ] `positionId` y `positionTitle` presentes

**Postman:** `GET /positions/2/candidates`
**Swagger:** `GET /positions/{id}/candidates` → id: 2

---

## 2. Validación de IDs Inválidos

### 2.1 ID texto

```bash
curl -X GET "http://localhost:3010/positions/abc"
```

| Herramienta | Input | Validar |
|------------|-------|---------|
| curl | `/positions/abc` | `400` + error message |
| Postman | `{{base}}/positions/abc` | Status: 400 |
| Swagger | id: `"abc"` | Schema validation error |

**Esperado:** `400 Bad Request` con `{ "error": "Invalid ID format" }`

### 2.2 ID negativo

```bash
curl -X GET "http://localhost:3010/positions/-5"
```

**Esperado:** `400 Bad Request`

### 2.3 ID cero

```bash
curl -X GET "http://localhost:3010/positions/0"
```

**Esperado:** `400 Bad Request`

### 2.4 ID float/decimal

```bash
curl -X GET "http://localhost:3010/positions/3.14"
```

**Esperado:** `400 Bad Request` o truncado a `3`

### 2.5 ID muy largo

```bash
curl -X GET "http://localhost:3010/positions/999999999999999"
```

**Esperado:** `400` o `404` (no existe)

---

## 3. Posición Inexistente

### 3.1 ID que no existe en BD

```bash
curl -X GET "http://localhost:3010/positions/999999"
```

| Herramienta | Input | Validar |
|------------|-------|---------|
| curl | `/positions/999999` | `404` |
| Postman | id: `999999` | Status: 404 |
| Swagger | id: `999999` | 404 Not Found |

**Esperado:** `404 Not Found` con `{ "error": "Position not found" }`

---

## 4. Candidatos Sin Entrevistas

### 4.1 averageScore null

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '.candidates[] | select(.averageScore == null)'
```

**Buscar candidatos sin entrevistas y validar:**
- [ ] `averageScore` es `null` (no `0`, no string, no `undefined`)
- [ ] `currentInterviewStep` tiene valor

---

## 5. Scores Null

### 5.1 Entrevistas sin score (todas null)

```bash
# Buscar applicationId con entrevistas sin score
# En DB: INSERT INTO "Interview" VALUES (app_id, step, emp, score=NULL)
curl -X GET "http://localhost:3010/positions/1/candidates"
```

**Validar para ese candidato:**
- [ ] `averageScore` = `null`
- [ ] No hay error 500

### 5.2 Mezcla: scores válidos y null

```sql
-- Crear datos de prueba
INSERT INTO "Interview" ("applicationId", "interviewStepId", "employeeId", score) VALUES (1, 1, 1, 8);
INSERT INTO "Interview" ("applicationId", "interviewStepId", "employeeId", score) VALUES (1, 2, 1, NULL);
INSERT INTO "Interview" ("applicationId", "interviewStepId", "employeeId", score) VALUES (1, 3, 1, 10);
```

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '.candidates[] | select(.candidateId == [id])'
```

**Validar:**
- [ ] `averageScore` = `9.0` (promedio de 8 y 10, ignorando null)
- [ ] Los null no participan en el cálculo

---

## 6. Múltiples Entrevistas

### 6.1 Verificar promedio correcto

```bash
# Crear 3 entrevistas con scores 7, 8, 9 para un candidato
# averageScore esperado = 8.0

curl -s "http://localhost:3010/positions/1/candidates" | jq '
  .candidates[] | 
  select(.candidateId == [id]) | 
  {candidateName, averageScore}
'
```

**Validar:**
- [ ] `averageScore` = `8.0` (redondeado a 1 decimal)
- [ ] Fórmula: (7 + 8 + 9) / 3 = 8.0

### 6.2 Orden de entrevistas no afecta resultado

```sql
-- Crear en orden diferente
INSERT INTO "Interview" VALUES (1, 3, 1, 10);  -- Primero la última
INSERT INTO "Interview" VALUES (1, 2, 1, 8);   -- Después la del medio
INSERT INTO "Interview" VALUES (1, 1, 1, 6);   -- Finalmente la primera
```

**Validar:**
- [ ] `averageScore` = `8.0` sin importar orden de creación

---

## 7. Candidatos Duplicados

### 7.1 Mismo candidato, múltiples aplicaciones

```sql
-- Crear 2 aplicaciones del mismo candidato a la misma posición
INSERT INTO "Application" ("positionId", "candidateId", "currentInterviewStep")
VALUES (1, 1, 1);

INSERT INTO "Application" ("positionId", "candidateId", "currentInterviewStep")
VALUES (1, 1, 2);
```

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '.candidates[] | select(.candidateId == 1)'
```

**Validar:**
- [ ] El candidato aparece 2 veces en el array
- [ ] Cada uno tiene datos diferentes (`currentInterviewStep` diferente)
- [ ] Cada uno tiene su propio `averageScore`

**Decision needed:** ¿Es este comportamiento intencional o se debe filtrar con `DISTINCT`?

---

## 8. Performance

### 8.1 Tiempo de respuesta normal

```bash
curl -s -w "\n\nHTTP Status: %{http_code}\nTime: %{time_total}s\n" \
  "http://localhost:3010/positions/1/candidates" -o /dev/null
```

**Validar:**
- [ ] Tiempo < `500ms` para < 50 candidatos
- [ ] Tiempo < `1000ms` para < 100 candidatos

### 8.2 Headers de response

```bash
curl -I "http://localhost:3010/positions/1/candidates"
```

**Validar:**
- [ ] `Content-Type: application/json`
- [ ] `Content-Length` presente
- [ ] Sin headers de cache innecesarios

### 8.3 Concurrencia

```bash
# Simular 10 requests concurrentes
for i in {1..10}; do 
  curl -s "http://localhost:3010/positions/1/candidates" -o /dev/null -w "%{time_total}\n" &
done
wait
```

**Validar:**
- [ ] Todas las requests completan
- [ ] Sin timeouts
- [ ] Tiempos similares entre requests

---

## 9. Validación de Response

### 9.1 Estructura JSON

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq 'keys'
```

**Esperado:**
```json
[
  "positionId",
  "positionTitle",
  "candidates"
]
```

**Validar:**
- [ ] Solo 3 campos en root
- [ ] No hay campos adicionales

### 9.2 Estructura de candidato

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '.candidates[0] | keys'
```

**Esperado:**
```json
[
  "candidateId",
  "candidateName",
  "currentInterviewStep",
  "averageScore"
]
```

### 9.3 Tipos de datos

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '
  .candidates[0] | {
    candidateId: (.candidateId | type),
    candidateName: (.candidateName | type),
    currentInterviewStep: (.currentInterviewStep | type),
    averageScore: (.averageScore | type)
  }
'
```

**Esperado:**
```json
{
  "candidateId": "number",
  "candidateName": "string",
  "currentInterviewStep": "string",
  "averageScore": "number"  // o "null"
}
```

### 9.4 No overfetching

**Validar que NO incluye:**
- [ ] `email`
- [ ] `phone`
- [ ] `address`
- [ ] `notes`
- [ ] Datos de entrevistas individuales

---

## 10. Validación de Ordenamiento

### 10.1 Orden por applicationDate descendente

```bash
curl -s "http://localhost:3010/positions/1/candidates" | jq '
  .candidates | map(.candidateId) | 
  to_entries | 
  sort_by(.key) | 
  map(.value)
'
```

**Verificar en DB:**
```sql
SELECT a.id, a."candidateId", a."applicationDate"
FROM "Application" a
WHERE a."positionId" = 1
ORDER BY a."applicationDate" DESC;
```

**Validar:**
- [ ] El orden en response coincide con `ORDER BY applicationDate DESC`
- [ ] Más reciente primero

### 10.2 Estabilidad del orden

```bash
# Llamar 2 veces seguidas
curl -s "http://localhost:3010/positions/1/candidates" > /tmp/req1.json
curl -s "http://localhost:3010/positions/1/candidates" > /tmp/req2.json
diff /tmp/req1.json /tmp/req2.json
```

**Validar:**
- [ ] Mismo orden en ambas respuestas
- [ ] Sin randomización

---

## 11. Validación de AverageScore

### 11.1 Sin entrevistas

```sql
-- Crear Application sin entrevistas
INSERT INTO "Application" VALUES (1, 1, now(), 1);
```

**Validar:** `averageScore` = `null`

### 11.2 Una entrevista

```sql
INSERT INTO "Interview" VALUES (NEW_APP_ID, 1, 1, 9);
```

**Validar:** `averageScore` = `9.0`

### 11.3 Dos entrevistas

```sql
INSERT INTO "Interview" VALUES (APP_ID, 1, 1, 8);
INSERT INTO "Interview" VALUES (APP_ID, 2, 1, 10);
```

**Validar:** `averageScore` = `9.0`

### 11.4 Tres+ entrevistas

```sql
INSERT INTO "Interview" VALUES (APP_ID, 1, 1, 6);
INSERT INTO "Interview" VALUES (APP_ID, 2, 1, 8);
INSERT INTO "Interview" VALUES (APP_ID, 3, 1, 10);
```

**Validar:** `averageScore` = `8.0`

### 11.5 Redondeo

```sql
-- Scores que generan decimal
INSERT INTO "Interview" VALUES (APP_ID, 1, 1, 7);
INSERT INTO "Interview" VALUES (APP_ID, 2, 1, 8);
INSERT INTO "Interview" VALUES (APP_ID, 3, 1, 9);
-- Promedio: 8.0
```

**Validar:**
- [ ] `8.0` (un decimal)
- [ ] No `8` ni `8.00`

---

## Resumen de Casos de Prueba

| # | Caso | Método | Status Esperado |
|---|------|--------|-----------------|
| 1 | Happy path con datos | GET /positions/1/candidates | 200 |
| 2 | Sin candidatos | GET /positions/2/candidates | 200 |
| 3 | ID texto | GET /positions/abc | 400 |
| 4 | ID negativo | GET /positions/-1 | 400 |
| 5 | ID cero | GET /positions/0 | 400 |
| 6 | Posición inexistente | GET /positions/999999 | 404 |
| 7 | Sin entrevistas | averageScore: null | 200 |
| 8 | Scores null | averageScore: null | 200 |
| 9 | Mezcla scores | averageScore: 9.0 | 200 |
| 10 | Múltiples entrevistas | averageScore correcto | 200 |
| 11 | Duplicados | Múltiples entradas | 200 |
| 12 | Performance | Time < 500ms | 200 |
| 13 | Ordenamiento | Más reciente primero | 200 |

---

## Comandos curl Resumen

```bash
# Happy path
curl -s "http://localhost:3010/positions/1/candidates" | jq .

# Sin candidatos
curl -s "http://localhost:3010/positions/2/candidates" | jq .

# ID inválido
curl -s "http://localhost:3010/positions/abc"

# No encontrado
curl -s "http://localhost:3010/positions/999999"

# Headers y tiempo
curl -s -w "\nTime: %{time_total}s\n" "http://localhost:3010/positions/1/candidates" -o /dev/null

# Verificar estructura
curl -s "http://localhost:3010/positions/1/candidates" | jq 'keys'
curl -s "http://localhost:3010/positions/1/candidates" | jq '.candidates[0] | keys'
```

---

**Última actualización:** Mayo 2026
**Estado:** ✅ Checklist completa