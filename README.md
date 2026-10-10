# College Records API · Hono & Prisma

[![CI](https://github.com/mgpavankumar/carbon/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/mgpavankumar/carbon/actions/workflows/ci.yml)

A PostgreSQL-backed API for students, professors, proctorships, and library memberships.

**Author:** [M. G. Pavan Kumar](https://github.com/mgpavankumar)
**Status:** Educational project

## Features

- Create, update, retrieve, and delete college records
- Assign students to professor proctorships
- Validate dates and membership periods
- Remove a student and membership atomically

## Getting started

Install Node.js 22 or newer and npm. Clone this repository:

```bash
git clone https://github.com/mgpavankumar/carbon.git
cd carbon
```

```bash
npm ci
```

Copy `.env.example` to `.env` and set `DATABASE_URL` for a dedicated local PostgreSQL database. Keep `.env` out of version control. Then run:

```bash
npm run db:generate
npm run db:migrate
npm run build
npm start
```

`npm start` runs the TypeScript entry point with the Node.js `tsx` loader. `npm run build` emits JavaScript into `dist/src`. `npm run dev` watches source files. The server listens on port 3000 unless `PORT` is set.

## Tests

Use a dedicated test database with the migrations applied. Set `TEST_DATABASE_URL` to its connection URL before running `npm test`. Tests create synthetic records and clean up only their own records. GitHub Actions provisions PostgreSQL 16 and runs migrations, compilation, and tests.

```bash
npm run typecheck
npm test
```

See [TEST_RESULTS.md](TEST_RESULTS.md) for recorded local verification and its limits.

## Project structure

| Path | Purpose |
| --- | --- |
| `src/app.ts` | HTTP application, routes, and request validation |
| `src/index.ts` | Server entry point |
| `tests/` | Automated regression checks |
| `tsconfig.json` | Strict ESM compilation settings |
| `prisma/schema.prisma` | Database models |
| `prisma/migrations/` | Versioned SQL migrations |
| `.env.example` | Placeholder local configuration |

## Current behavior and limitations

This learning API has no authentication or access control. Student and membership timestamps require ISO 8601 with a timezone. Duplicate records return 409, missing records 404, invalid input 400, and unexpected database errors 500. Use synthetic identity data when demonstrating this project.

## HTTP routes

| Method | Path |
| --- | --- |
| GET | `/` |
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

## Try the API

Use synthetic identity data in a local development database:

```bash
curl -i http://localhost:3000/students -H 'Content-Type: application/json' -d '{"name":"Demo Student","dateOfBirth":"2000-01-01T00:00:00Z","aadharNumber":"synthetic-demo-student-001"}'
curl -i http://localhost:3000/students/enriched
```

Expect HTTP 201 for creation and HTTP 200 with a list for retrieval. A repeated identity value returns 409. On Windows PowerShell use `curl.exe`.

## Contributing

Keep changes focused, use synthetic data, and include steps or tests demonstrating the fix. Do not commit local configuration or credentials.

## HTTP safeguards

Requests are limited to 64 KiB and oversized payloads return JSON with HTTP 413. Responses include Hono security headers. Responses use `Cache-Control: no-store` to discourage caching tokens and personal records.
