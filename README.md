# College Records API · Hono & Prisma

A PostgreSQL-backed API learning project for student records, professors, proctorships, and library memberships.

**Author:** [M. G. Pavan Kumar](https://github.com/mgpavankumar)  
**Status:** Educational project

## Features

- Manage student and professor records
- Assign students to professor proctorships
- Create, retrieve, update, and delete library memberships
- Fetch students with related proctor details

## Getting started

Install Node.js and npm. Clone this repository:

```bash
git clone https://github.com/mgpavankumar/carbon.git
cd carbon
```

For local development, create `.env` in the repository root:

```dotenv
DATABASE_URL="postgresql://app_user:replace_with_local_password@localhost:5432/carbon_dev?schema=public"
```

Replace the placeholder values with your local PostgreSQL settings. Keep `.env` out of version control.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Project structure

| Path | Purpose |
| --- | --- |
| `src/index.ts` | HTTP endpoints and Prisma queries |
| `prisma/schema.prisma` | Student, professor, and library membership models |
| `prisma/migrations/` | Committed database migrations |

## Current behavior and limitations

Create a local `.env` with `DATABASE_URL` before running Prisma commands. Use a dedicated development database: migrate dev can prompt for schema resets. The API currently has no authentication or access control. Use synthetic records for demonstrations. Error handling often returns 404 for database failures; refine status codes and validation before deployment.

## Routes declared in the source

| Method | Path |
| --- | --- |
| GET | `/students` |
| GET | `/students/enriched` |
| GET | `/professors` |
| POST | `/students` |
| POST | `/professors` |
| GET | `/professors/:professorId/proctorships` |
| PATCH | `/students/:studentId` |
| PATCH | `/professors/:professorId` |
| DELETE | `/students/:studentId` |
| DELETE | `/professors/:professorId` |
| POST | `/professors/:professorId/proctorships` |
| GET | `/students/:studentId/library-membership` |
| POST | `/students/:studentId/library-membership` |
| PATCH | `/students/:studentId/library-membership` |
| DELETE | `/students/:studentId/library-membership` |

## Planned improvements

- Add request validation and consistent error responses
- Add authentication and access rules
- Separate routes and database services

## Contributing

Open an issue describing the problem or proposed improvement. Keep pull requests focused and include the steps used to verify changes. Use sample data and keep credentials out of commits.

## Verification

This documentation was checked against the committed source files, dependency declarations, and route definitions. Installation, compilation, database setup, and runtime behavior have not been verified by this documentation update. There is no automated test suite in the current repository.
