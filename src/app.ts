import { serviceAccess } from './service-access.js';
import { addOperations } from './operations.js';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { Hono } from 'hono';
import { Prisma, PrismaClient } from '@prisma/client';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

const text = z.string().trim().min(1).max(200);
const date = z.string().datetime({ offset: true });
const studentSchema = z.object({ name: text, dateOfBirth: date, aadharNumber: text, proctorId: text.nullable().optional() }).strict();
const professorSchema = z.object({ name: text, seniority: z.enum(['JUNIOR', 'SENIOR', 'ASSOCIATE', 'HEAD']), aadharNumber: text }).strict();
const membershipSchema = z.object({ issueDate: date, expiryDate: date }).strict();

export function createApp(prisma: PrismaClient, options: { readiness?: () => Promise<unknown>; serviceKey?: string } = {}) {
  const app = new Hono();
  app.use('*', secureHeaders());
  addOperations(app, options.readiness ?? (() => prisma.$queryRaw`SELECT 1 FROM "Student", "professor", "LibraryMembership" WHERE FALSE`));
  app.use('*', bodyLimit({ maxSize: 64 * 1024, onError: c => c.json({ error: 'Request body exceeds 64 KiB' }, 413) }));
  app.use('*', serviceAccess(options.serviceKey));
  app.onError((error, c) => {
    if (error instanceof HTTPException) return c.json({ error: error.message }, error.status);
    if (error instanceof z.ZodError || error instanceof SyntaxError) return c.json({ error: 'Invalid request body' }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return c.json({ error: 'Record already exists' }, 409);
      if (error.code === 'P2025') return c.json({ error: 'Record not found' }, 404);
      if (error.code === 'P2003') return c.json({ error: 'Related record is missing or still in use' }, 409);
    }
    console.error('Request failed:', error instanceof Error ? error.name : 'Unknown error');
    return c.json({ error: 'Internal server error' }, 500);
  });
  app.get('/', c => c.text('College Records API'));
  app.get('/students', async c => c.json(await prisma.student.findMany({ include: { libraryMembership: true } })));
  app.get('/students/enriched', async c => c.json(await prisma.student.findMany({ include: { proctor: true } })));
  app.get('/professors', async c => c.json(await prisma.professor.findMany()));
  app.post('/students', async c => {
    const data = studentSchema.parse(await c.req.json());
    return c.json(await prisma.student.create({ data }), 201);
  });
  app.post('/professors', async c => {
    const data = professorSchema.parse(await c.req.json());
    return c.json(await prisma.professor.create({ data }), 201);
  });
  app.get('/professors/:professorId/proctorships', async c => {
    const proctorId = c.req.param('professorId');
    if (!await prisma.professor.findUnique({ where: { professorId: proctorId } })) throw new HTTPException(404, { message: 'Professor not found' });
    return c.json(await prisma.student.findMany({ where: { proctorId } }));
  });
  app.patch('/students/:studentId', async c => {
    const data = studentSchema.partial().parse(await c.req.json());
    if (!Object.keys(data).length) throw new HTTPException(400, { message: 'No update fields' });
    return c.json(await prisma.student.update({ where: { id: c.req.param('studentId') }, data }));
  });
  app.patch('/professors/:professorId', async c => {
    const data = professorSchema.partial().parse(await c.req.json());
    if (!Object.keys(data).length) throw new HTTPException(400, { message: 'No update fields' });
    return c.json(await prisma.professor.update({ where: { professorId: c.req.param('professorId') }, data }));
  });
  app.delete('/students/:studentId', async c => {
    const id = c.req.param('studentId');
    // The existing schema restricts deleting a student with a membership. Remove it atomically.
    const deleted = await prisma.$transaction(async tx => {
      await tx.libraryMembership.deleteMany({ where: { studentId: id } });
      return tx.student.delete({ where: { id } });
    });
    return c.json({ 'Deleted Student': deleted });
  });
  app.delete('/professors/:professorId', async c => c.json({ 'Deleted Professor': await prisma.professor.delete({ where: { professorId: c.req.param('professorId') } }) }));
  app.post('/professors/:professorId/proctorships', async c => {
    const { studentId } = z.object({ studentId: text }).strict().parse(await c.req.json());
    const professorId = c.req.param('professorId');
    if (!await prisma.professor.findUnique({ where: { professorId } })) throw new HTTPException(404, { message: 'Professor not found' });
    return c.json({ 'Updated Student Proctorship': await prisma.student.update({ where: { id: studentId }, data: { proctorId: professorId } }) });
  });
  app.get('/students/:studentId/library-membership', async c => {
    const record = await prisma.libraryMembership.findUnique({ where: { studentId: c.req.param('studentId') }, include: { student: true } });
    if (!record) throw new HTTPException(404, { message: 'Membership not found' });
    return c.json(record);
  });
  app.post('/students/:studentId/library-membership', async c => {
    const data = membershipSchema.parse(await c.req.json());
    if (new Date(data.expiryDate) <= new Date(data.issueDate)) throw new HTTPException(400, { message: 'Expiry must be after issue date' });
    const studentId = c.req.param('studentId');
    if (!await prisma.student.findUnique({ where: { id: studentId } })) throw new HTTPException(404, { message: 'Student not found' });
    return c.json(await prisma.libraryMembership.create({ data: { studentId, ...data } }), 201);
  });
  app.patch('/students/:studentId/library-membership', async c => {
    const data = membershipSchema.partial().parse(await c.req.json());
    if (!Object.keys(data).length) throw new HTTPException(400, { message: 'No update fields' });
    const studentId = c.req.param('studentId');
    const existing = await prisma.libraryMembership.findUnique({ where: { studentId } });
    if (!existing) throw new HTTPException(404, { message: 'Membership not found' });
    const issue = data.issueDate ? new Date(data.issueDate) : existing.issueDate;
    const expiry = data.expiryDate ? new Date(data.expiryDate) : existing.expiryDate;
    if (expiry <= issue) throw new HTTPException(400, { message: 'Expiry must be after issue date' });
    return c.json(await prisma.libraryMembership.update({ where: { studentId }, data }));
  });
  app.delete('/students/:studentId/library-membership', async c => c.json({ 'Deleted Library Membership': await prisma.libraryMembership.delete({ where: { studentId: c.req.param('studentId') } }) }));
  return app;
}
