# College Records API · Hono & Prisma

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
| `src/app.ts` | Application logic and/or demonstration |
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

## Contributing

Keep changes focused, use synthetic data, and include steps or tests demonstrating the fix. Do not commit local configuration or credentials.
