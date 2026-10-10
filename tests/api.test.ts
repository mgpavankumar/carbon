import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../src/app.js';

if (!process.env.TEST_DATABASE_URL) throw new Error('Set TEST_DATABASE_URL to a dedicated test database');
const prisma = new PrismaClient({ datasources: { db: { url: process.env.TEST_DATABASE_URL } } });
const students: string[] = [], professors: string[] = [];
const app = createApp(prisma);
const json = (method: string, body: unknown) => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
after(async () => {
  await prisma.libraryMembership.deleteMany({ where: { studentId: { in: students } } });
  await prisma.student.deleteMany({ where: { id: { in: students } } });
  await prisma.professor.deleteMany({ where: { professorId: { in: professors } } });
  await prisma.$disconnect();
});

test('student, proctor, and membership lifecycle including deletion', async () => {
  const professorResponse = await app.request('/professors', json('POST', { name: 'Test Professor', seniority: 'SENIOR', aadharNumber: randomUUID() }));
  assert.equal(professorResponse.status, 201);
  const professor = await professorResponse.json(); professors.push(professor.professorId);
  const studentResponse = await app.request('/students', json('POST', { name: 'Test Student', dateOfBirth: '2000-01-01T00:00:00Z', aadharNumber: randomUUID() }));
  assert.equal(studentResponse.status, 201);
  const student = await studentResponse.json(); students.push(student.id);
  assert.equal((await app.request(`/professors/${professor.professorId}/proctorships`, json('POST', { studentId: student.id }))).status, 200);
  assert.equal((await (await app.request(`/professors/${professor.professorId}/proctorships`)).json()).length, 1);
  const membership = { issueDate: '2026-01-01T00:00:00Z', expiryDate: '2027-01-01T00:00:00Z' };
  const path = `/students/${student.id}/library-membership`;
  assert.equal((await app.request(path, json('POST', membership))).status, 201);
  assert.equal((await app.request(path, json('POST', membership))).status, 409);
  if (process.env.PGLITE_TEST === '1') await prisma.$disconnect();
  assert.equal((await app.request(path)).status, 200);
  assert.equal((await app.request(path, json('PATCH', { expiryDate: '2028-01-01T00:00:00Z' }))).status, 200);
  assert.equal((await app.request(path, json('PATCH', { expiryDate: '2025-01-01T00:00:00Z' }))).status, 400);
  assert.equal((await app.request(`/students/${student.id}`, json('PATCH', { name: 'Updated' }))).status, 200);
  assert.equal((await app.request(`/professors/${professor.professorId}`, json('PATCH', { seniority: 'HEAD' }))).status, 200);
  for (const route of ['/students', '/students/enriched', '/professors']) assert.equal((await app.request(route)).status, 200);
  assert.equal((await app.request(path, { method: 'DELETE' })).status, 200);
  await app.request(path, json('POST', membership));
  assert.equal((await app.request(`/students/${student.id}`, { method: 'DELETE' })).status, 200);
  assert.equal(await prisma.libraryMembership.count({ where: { studentId: student.id } }), 0);
  assert.equal((await app.request(`/professors/${professor.professorId}`, { method: 'DELETE' })).status, 200);
});
test('duplicate records and invalid body types', async () => {
  const body = { name: 'Test', dateOfBirth: '2000-01-01T00:00:00Z', aadharNumber: randomUUID() };
  const response = await app.request('/students', json('POST', body));
  assert.equal(response.status, 201);
  const student = await response.json(); students.push(student.id);
  assert.equal((await app.request('/students', json('POST', body))).status, 409);
  if (process.env.PGLITE_TEST === '1') await prisma.$disconnect();
  assert.equal((await app.request('/students', json('POST', { ...body, name: 12 }))).status, 400);
  assert.equal((await app.request('/professors', json('POST', { name: 'Test', seniority: 'INVALID', aadharNumber: randomUUID() }))).status, 400);
  assert.equal((await app.request(`/students/${student.id}`, json('PATCH', { id: 'changed' }))).status, 400);
});
test('missing resources and malformed JSON', async () => {
  assert.equal((await app.request('/students/missing', { method: 'DELETE' })).status, 404);
  assert.equal((await app.request('/students/missing/library-membership')).status, 404);
  assert.equal((await app.request('/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' })).status, 400);
});
test('unexpected database failures are 500, not 404', async () => {
  const broken = { student: { findMany: async () => { throw new Error('Database unavailable'); } } } as unknown as PrismaClient;
  assert.equal((await createApp(broken).request('/students')).status, 500);
});
