# LTI - Talent Tracking System | EN

This project is a full-stack application with a React frontend and an Express backend using Prisma as an ORM. The frontend is started with Create React App, and the backend is written in TypeScript.

## Explanation of Directories and Files

- `backend/`: Contains the server-side code written in Node.js.
  - `src/`: Contains the source code for the backend.
    - `index.ts`: The entry point for the backend server.
    - `application/`: Contains the application logic.
    - `domain/`: Contains the business logic.
    - `infrastructure/`: Contains code that communicates with the database.
    - `presentation/`: Contains code related to the presentation layer (such as controllers).
    - `routes/`: Contains the route definitions for the API.
    - `tests/`: Contains test files.
  - `prisma/`: Contains the Prisma schema file for ORM.
  - `tsconfig.json`: TypeScript configuration file.
- `frontend/`: Contains the client-side code written in React."
  - `src/`: Contains the source code for the frontend.
  - `public/`: Contains static files such as the HTML file and images.
  - `build/`: Contains the production-ready build of the frontend.
- `.env`: Contains the environment variables.
- `docker-compose.yml`: Contains the Docker Compose configuration to manage your application's services.
- `README.md`: This file contains information about the project and instructions on how to run it.

## Project Structure

The project is divided into two main directories: `frontend` and `backend`.

### Frontend

The frontend is a React application, and its main files are located in the src directory. The public directory contains static assets, and the build directory contains the production build of the application.

### Backend

The backend is an Express application written in TypeScript. The src directory contains the source code, divided into several subdirectories:

- `application`: Contains the application logic.
- `domain`: Contains the domain models.
- `infrastructure`: Contains code related to the infrastructure.
- `presentation`: Contains code related to the presentation layer.
- `routes`: Contains the application routes.
- `tests`: Contains the application tests.

The `prisma` directory contains the Prisma schema.

## First steps

To get started with this project, follow these steps:

1. Clone the repository.
2. Install the dependencies for the frontend and backend:

```sh
cd frontend
npm install

cd ../backend
npm install
```
3. Build the backend server:
```
cd backend
npm run build
````
4. Start the backend server:
```
cd backend
npm start
```
5. In a new terminal window, build the frontend server:
```
cd frontend
npm run build
```
6. Start the frontend server:
```
cd frontend
npm start
```

The backend server will be running at http://localhost:3010 and the frontend will be available at http://localhost:3000.

## Docker and PostgreSQL

This project uses Docker to run a PostgreSQL database. Here's how to set it up:

Install Docker on your machine if you haven't done so already. You can download it from here.
Navigate to the root directory of the project in your terminal.
Run the following command to start the Docker container:

```
docker-compose up -d
```
This will start a PostgreSQL database in a Docker container. The -d flag runs the container in detached mode, which means it runs in the background.

To access the PostgreSQL database, you can use any PostgreSQL client with the following connection details:

- Host: localhost
- Port: 5432
- User: postgres
- Password: password
- Database: mydatabase
  
Please replace User, Password, and Database with the actual username, password, and database name specified in your .env file.

To stop the Docker container, run the following command:

```
docker-compose down
```
To generate the database using Prisma, follow these steps:

1. Make sure that the .env file in the root directory of the backend contains the DATABASE_URL variable with the correct connection string to your PostgreSQL database. If it doesn’t work, try replacing the full URL directly in schema.prisma, in the url variable.

2. Open a terminal and navigate to the backend directory where the schema.prisma and seed.ts files are located.

3. Run the following commands to generate the Prisma structure, apply migrations to your database, and populate it with sample data:

```
npx prisma generate
npx prisma migrate dev
ts-node seed.ts
```

Once you have completed all the steps, you should be able to save new candidates, both via web and via API, view them in the database, and retrieve them using GET by ID.

```
POST http://localhost:3010/candidates
{
    "firstName": "Albert",
    "lastName": "Saelices",
    "email": "albert.saelices@gmail.com",
    "phone": "656874937",
    "address": "Calle Sant Dalmir 2, 5ºB. Barcelona",
    "educations": [
        {
            "institution": "UC3M",
            "title": "Computer Science",
            "startDate": "2006-12-31",
            "endDate": "2010-12-26"
        }
    ],
"workExperiences": [
        {
            "company": "Coca Cola",
            "position": "SWE",
            "description": "",
            "startDate": "2011-01-13",
            "endDate": "2013-01-17"
        }
    ],
    "cv": {
        "filePath": "uploads/1715760936750-cv.pdf",
        "fileType": "application/pdf"
    }
}
```

---

## Testing | EN

This project includes automated tests using Jest. Tests are located in `backend/src/__tests__/`.

### Running Tests

```sh
cd backend
npm test
```

### Test Files

- `updateCandidateStage.service.test.ts` - Tests for PUT /candidates/:id/stage service layer
- `updateCandidateStage.controller.test.ts` - Tests for PUT /candidates/:id/stage controller layer (with mocks)
- `getCandidatesByPosition.test.ts` - Tests for GET /positions/:id/candidates endpoint

### Test Coverage

The test suite validates:
- **PUT /candidates/:id/stage**: Update candidate interview stage
  - Happy paths (stage update success)
  - Error handling (candidate not found, application not found, invalid step)
  - Controller validation (invalid IDs, HTTP status mapping)

- **GET /positions/:id/candidates**: Get candidates by position
  - Happy paths (with/without candidates)
  - ID validation (text, negative, zero, float IDs return 400)
  - 404 for non-existent positions
  - Response structure validation
  - Average score calculation

---

## Testing | ES

Este proyecto incluye pruebas automatizadas usando Jest. Las pruebas están ubicadas en `backend/src/__tests__/`.

### Ejecutar Tests

```sh
cd backend
npm test
```

### Archivos de Tests

- `updateCandidateStage.service.test.ts` - Tests para el servicio PUT /candidates/:id/stage
- `updateCandidateStage.controller.test.ts` - Tests para el controlador PUT /candidates/:id/stage (con mocks)
- `getCandidatesByPosition.test.ts` - Tests para el endpoint GET /positions/:id/candidates

### Cobertura de Tests

El conjunto de pruebas valida:
- **PUT /candidates/:id/stage**: Actualizar etapa de entrevista del candidato
  - Caminos felices (actualización de etapa exitosa)
  - Manejo de errores (candidato no encontrado, aplicación no encontrada, paso inválido)
  - Validación del controlador (IDs inválidos, mapeo de estados HTTP)

- **GET /positions/:id/candidates**: Obtener candidatos por posición
  - Caminos felices (con/sin candidatos)
  - Validación de ID (texto, negativo, cero, float → 400)
  - 404 para posiciones inexistentes
  - Validación de estructura de respuesta
  - Cálculo de puntuación promedio

---

## API Endpoints | EN

### GET /positions/:id/candidates

Returns a list of candidates for a specific position with their interview scores.

**Request:**
```
GET http://localhost:3010/positions/:id/candidates
```

**Response (200):**
```json
{
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "candidates": [
    {
      "candidateId": 1,
      "candidateName": "John Doe",
      "currentInterviewStep": "Technical Interview",
      "averageScore": 8.5
    }
  ]
}
```

**Validation:**
- ID must be a positive integer (returns 400 otherwise)
- Returns 404 if position doesn't exist

### PUT /candidates/:id/stage

Updates the interview stage for a candidate's application.

**Request:**
```
PUT http://localhost:3010/candidates/:id/stage
{
  "applicationId": 1,
  "newStepId": 2
}
```

**Response (200):**
```json
{
  "applicationId": 1,
  "candidateId": 1,
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "previousStepId": 1,
  "previousStepName": "Initial Review",
  "currentInterviewStep": 2,
  "stepName": "Technical Interview",
  "stepOrder": 2,
  "notes": null,
  "updatedAt": "2026-05-19T17:00:00.000Z"
}
```

---

## API Endpoints | ES

### GET /positions/:id/candidates

Devuelve una lista de candidatos para una posición específica con sus puntuaciones de entrevista.

**Solicitud:**
```
GET http://localhost:3010/positions/:id/candidates
```

**Respuesta (200):**
```json
{
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "candidates": [
    {
      "candidateId": 1,
      "candidateName": "John Doe",
      "currentInterviewStep": "Technical Interview",
      "averageScore": 8.5
    }
  ]
}
```

**Validación:**
- El ID debe ser un entero positivo (devuelve 400 en caso contrario)
- Devuelve 404 si la posición no existe

### PUT /candidates/:id/stage

Actualiza la etapa de entrevista para la aplicación de un candidato.

**Solicitud:**
```
PUT http://localhost:3010/candidates/:id/stage
{
  "applicationId": 1,
  "newStepId": 2
}
```

**Respuesta (200):**
```json
{
  "applicationId": 1,
  "candidateId": 1,
  "positionId": 1,
  "positionTitle": "Software Engineer",
  "previousStepId": 1,
  "previousStepName": "Initial Review",
  "currentInterviewStep": 2,
  "stepName": "Technical Interview",
  "stepOrder": 2,
  "notes": null,
  "updatedAt": "2026-05-19T17:00:00.000Z"
}
```

 --------------------------------------------

 # LTI - Sistema de Seguimiento de Talento | ES

Este proyecto es una aplicación full-stack con un frontend en React y un backend en Express usando Prisma como un ORM. El frontend se inicia con Create React App y el backend está escrito en TypeScript.

## Explicación de Directorios y Archivos

- `backend/`: Contiene el código del lado del servidor escrito en Node.js.
  - `src/`: Contiene el código fuente para el backend.
    - `index.ts`: El punto de entrada para el servidor backend.
    - `application/`: Contiene la lógica de aplicación.
    - `domain/`: Contiene la lógica de negocio.
    - `infrastructure/`: Contiene código que se comunica con la base de datos.
    - `presentation/`: Contiene código relacionado con la capa de presentación (como controladores).
    - `routes/`: Contiene las definiciones de rutas para la API.
    - `tests/`: Contiene archivos de prueba.
  - `prisma/`: Contiene el archivo de esquema de Prisma para ORM.
  - `tsconfig.json`: Archivo de configuración de TypeScript.
- `frontend/`: Contiene el código del lado del cliente escrito en React.
  - `src/`: Contiene el código fuente para el frontend.
  - `public/`: Contiene archivos estáticos como el archivo HTML e imágenes.
  - `build/`: Contiene la construcción lista para producción del frontend.
- `.env`: Contiene las variables de entorno.
- `docker-compose.yml`: Contiene la configuración de Docker Compose para gestionar los servicios de tu aplicación.
- `README.md`: Este archivo, contiene información sobre el proyecto e instrucciones sobre cómo ejecutarlo.

## Estructura del Proyecto

El proyecto está dividido en dos directorios principales: `frontend` y `backend`.

### Frontend

El frontend es una aplicación React y sus archivos principales están ubicados en el directorio `src`. El directorio `public` contiene activos estáticos y el directorio `build` contiene la construcción de producción de la aplicación.

### Backend

El backend es una aplicación Express escrita en TypeScript. El directorio `src` contiene el código fuente, dividido en varios subdirectorios:

- `application`: Contiene la lógica de aplicación.
- `domain`: Contiene los modelos de dominio.
- `infrastructure`: Contiene código relacionado con la infraestructura.
- `presentation`: Contiene código relacionado con la capa de presentación.
- `routes`: Contiene las rutas de la aplicación.
- `tests`: Contiene las pruebas de la aplicación.

El directorio `prisma` contiene el esquema de Prisma.

## Primeros Pasos

Para comenzar con este proyecto, sigue estos pasos:

1. Clona el repositorio.
2. Instala las dependencias para el frontend y el backend:
```sh
cd frontend
npm install

cd ../backend
npm install
```
3. Construye el servidor backend:
```
cd backend
npm run build
````
4. Inicia el servidor backend:
```
cd backend
npm start
```
5. En una nueva ventana de terminal, construye el servidor frontend:
```
cd frontend
npm run build
```
6. Inicia el servidor frontend:
```
cd frontend
npm start
```

El servidor backend estará corriendo en http://localhost:3010 y el frontend estará disponible en http://localhost:3000.

## Docker y PostgreSQL

Este proyecto usa Docker para ejecutar una base de datos PostgreSQL. Así es cómo ponerlo en marcha:

Instala Docker en tu máquina si aún no lo has hecho. Puedes descargarlo desde aquí.
Navega al directorio raíz del proyecto en tu terminal.
Ejecuta el siguiente comando para iniciar el contenedor Docker:
```
docker-compose up -d
```
Esto iniciará una base de datos PostgreSQL en un contenedor Docker. La bandera -d corre el contenedor en modo separado, lo que significa que se ejecuta en segundo plano.

Para acceder a la base de datos PostgreSQL, puedes usar cualquier cliente PostgreSQL con los siguientes detalles de conexión:
 - Host: localhost
 - Port: 5432
 - User: postgres
 - Password: password
 - Database: mydatabase

Por favor, reemplaza User, Password y Database con el usuario, la contraseña y el nombre de la base de datos reales especificados en tu archivo .env.

Para detener el contenedor Docker, ejecuta el siguiente comando:
```
docker-compose down
```

Para generar la base de datos utilizando Prisma, sigue estos pasos:

1. Asegúrate de que el archivo `.env` en el directorio raíz del backend contenga la variable `DATABASE_URL` con la cadena de conexión correcta a tu base de datos PostgreSQL. Si no te funciona, prueba a reemplazar la URL completa directamente en `schema.prisma`, en la variable `url`.

2. Abre una terminal y navega al directorio del backend donde se encuentra el archivo `schema.prisma` y `seed.ts`.

3. Ejecuta los siguientes comandos para generar la estructura de prisma, las migraciones a tu base de datos y poblarla con datos de ejemplo:
```
npx prisma generate
npx prisma migrate dev
ts-node seed.ts
```

Una vez has dado todos los pasos, deberías poder guardar nuevos candidatos, tanto via web, como via API, verlos en la base de datos y obtenerlos mediante GET por id.

```
POST http://localhost:3010/candidates
{
    "firstName": "Albert",
    "lastName": "Saelices",
    "email": "albert.saelices@gmail.com",
    "phone": "656874937",
    "address": "Calle Sant Dalmir 2, 5ºB. Barcelona",
    "educations": [
        {
            "institution": "UC3M",
            "title": "Computer Science",
            "startDate": "2006-12-31",
            "endDate": "2010-12-26"
        }
    ],
    "workExperiences": [
        {
            "company": "Coca Cola",
            "position": "SWE",
            "description": "",
            "startDate": "2011-01-13",
            "endDate": "2013-01-17"
        }
    ],
    "cv": {
        "filePath": "uploads/1715760936750-cv.pdf",
        "fileType": "application/pdf"
    }
}
```

