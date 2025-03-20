import { PrismaClient } from "@prisma/client";
import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();
const prisma = new PrismaClient();

//1. Retrieve all students in the college.
app.get("/students", async (context) => {
  try {
    const student = await prisma.student.findMany({
      include: {
        libraryMembership: true
      }
    });
    return context.json(student);
  } catch (error) {
    console.error("Error finding student data: ", error);
    return context.json("404 Error: Data not found.", 404);
  }
});

//2. Retrieve all students in the college along with their proctor details.
app.get("/students/enriched", async (context) => {
  try {
    const enriched = await prisma.student.findMany({
      include: {
        proctor: true,
      },
    });
    return context.json(enriched);
  } catch (error) {
    console.error("Error finding student's proctorship data: ", error);
    return context.json("404 Error: Data not found.", 404);
  }
});

//3. Retrieve all professors in the college.
app.get("/professors", async (context) => {
  try {
    const professor = await prisma.professor.findMany();
    return context.json(professor);
  } catch (error) {
    console.error("Error finding professor data: ", error);
    return context.json("404 Error: Data not found.", 404);
  }
});

//4. Create a new student, ensuring no duplicates based on Aadhar number.
app.post("/students", async (context) => {
  const { name, dateOfBirth, aadharNumber } = await context.req.json();
  try {
    const aadharExists = await prisma.student.findUnique({
      where: {
        aadharNumber: aadharNumber,
      },
    });
    if (aadharExists) {
      return context.json("Error: Aadhar number already exists.", 404);
    }

    const student = await prisma.student.create({
      data: {
        name: name,
        dateOfBirth: dateOfBirth,
        aadharNumber: aadharNumber,
      },
    });
    return context.json(student, 200);
  } catch (error) {
    console.error("Error creating student: ", error);
    return context.json("404 Error: Unable to create a student data.", 404);
  }
});

//5. Create a new professor, ensuring no duplicates based on Aadhar number.
app.post("/professors", async (context) => {
  const { name, seniority, aadharNumber } = await context.req.json();
  try {
    const aadharExists = await prisma.professor.findUnique({
      where: {
        aadharNumber: aadharNumber,
      },
    });

    if (aadharExists) {
      return context.json("Error: Aadhar number already exists.", 404);
    }

    const prof = await prisma.professor.create({
      data: {
        name: name,
        seniority: seniority,
        aadharNumber: aadharNumber,
      },
    });

    return context.json(prof, 200);
  } catch (error) {
    console.error("Error creating professor: ", error);
    return context.json("404 Error: Unable to create a professor data.", 404);
  }
});

//6. Returns all students under the proctorship of the given professor.
app.get("/professors/:professorId/proctorships", async (context) => {
  const professorId = context.req.param("professorId");
  try {
    const students = await prisma.student.findMany({
      where: {
        proctorId: professorId,
      },
    });
    return context.json(students);
  } catch (error) {
    console.error("Error finding proctorship: ", error);
    return context.json("404 Error: Unable to find proctorships.", 404);
  }
});

//7. Updates the details of a student by their id.
app.patch("/students/:studentId", async (context) => {
  const studentId = context.req.param("studentId");
  const { name, dateOfBirth, aadharNumber, proctorId } =
    await context.req.json();
  try {
    const uniqueStudentId = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });
    if (!uniqueStudentId) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const student = await prisma.student.update({
      where: {
        id: studentId,
      },
      data: {
        name: name,
        dateOfBirth: dateOfBirth,
        aadharNumber: aadharNumber,
        proctorId: proctorId,
      },
    });
    return context.json(student, 200);
  } catch (error) {
    console.error("Error updating student data: ", error);
    return context.json("404 Error: Unable to update student data.", 404);
  }
});

//8. Updates the details of a professor by their id.
app.patch("/professors/:professorId", async (context) => {
  const professorId = context.req.param("professorId");
  const { name, seniority, aadharNumber } = await context.req.json();
  try {
    const uniqueProfessorId = await prisma.professor.findUnique({
      where: {
        professorId: professorId,
      },
    });
    if (!uniqueProfessorId) {
      return context.json("404 Error: Unable to find professor data.", 404);
    }

    const professor = await prisma.professor.update({
      where: {
        professorId: professorId,
      },
      data: {
        name: name,
        seniority: seniority,
        aadharNumber: aadharNumber,
      },
    });
    return context.json(professor, 200);
  } catch (error) {
    console.error("Error updating professor data: ", error);
    return context.json("404 Error: Unable to update professor data.", 404);
  }
});

//9. Deletes a student by their id.
app.delete("/students/:studentId", async (context) => {
  const studentId = context.req.param("studentId");
  try {
    const uniqueStudentId = await prisma.student.findUnique({
      where: {
        id: studentId,
      },
    });

    if (!uniqueStudentId) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const deletedStudent = await prisma.student.delete({
      where: {
        id: studentId,
      },
    });

    return context.json({ "Deleted Student": deletedStudent }, 200);
  } catch (error) {
    console.error("Error deleting student data: ", error);
    return context.json("404 Error: Unable to delete student data.", 404);
  }
});

//10. Deletes a professor by their id.
app.delete("/professors/:professorId", async (context) => {
  const profId = context.req.param("professorId");
  try {
    const uniqueProfessorId = await prisma.professor.findUnique({
      where: {
        professorId: profId,
      },
    });

    if (!uniqueProfessorId) {
      return context.json("404 Error: Unable to find professor data.", 404);
    }

    const deletedProfessor = await prisma.professor.delete({
      where: {
        professorId: profId,
      },
    });

    return context.json({ "Deleted Professor": deletedProfessor }, 200);
  } catch (error) {
    console.error("Error deleting professor data: ", error);
    return context.json("404 Error: Unable to delete professor data.", 404);
  }
});

//11. Assigns a student under the proctorship of the professor referenced by professorId.
app.post("/professors/:professorId/proctorships", async (context) => {
  const profId = context.req.param("professorId");
  const { studentId } = await context.req.json();

  try {
    const existProf = await prisma.professor.findUnique({
      where: {
        professorId: profId
      },
    });
    if (!existProf) {
      return context.json("404 Error: Unable to find professor data.", 404);
    }

    const existStudent = await prisma.student.findUnique({
      where: {
        id: studentId
      },
    });
    if (!existStudent) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const updateStudentProctorship = await prisma.student.update({
      where: {
        id: studentId
      },
      data: {
        proctorId: profId
      },
    });

    return context.json(
      { "Updated Student Proctorship ": updateStudentProctorship },
      200
    );
  } catch (error) {
    console.error("Error assigning student proctorship: ", error);
    return context.json("404 Error: Unable to assign student proctorship", 404);
  }
});

//12. Returns the library membership details of the specified student.
app.get("/students/:studentId/library-membership", async (context) => {
  const studentId = context.req.param("studentId");
  try {
    const existStudent = await prisma.student.findUnique({
      where: {
        id: studentId
      },
    });
    if (!existStudent) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const existLibraryMembership = await prisma.libraryMembership.findUnique({
      include: {
        student: true,
      },
      where: {
        studentId: studentId
      },
    });
    if (!existLibraryMembership) {
      return context.json("404 Error: Unable to find library membership data.", 404);
    }

    return context.json(existLibraryMembership, 200);

  } catch (error) {
    console.error("Error getting student library membership: ", error);
    return context.json("404 Error: Unable to get student library membership", 404);
  }
});

//13. Creates a library membership for the specified student. Ensure no duplicate library memberships for a student.
app.post("/students/:studentId/library-membership", async (context) => {
  const {studentId} = context.req.param();
  const { issueDate, expiryDate } = await context.req.json();

  try {

    const existStudent = await prisma.student.findUnique({
      where: {
        id: studentId
      },
    });
    if (!existStudent) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const existLibraryMembership = await prisma.libraryMembership.findUnique({
      where: {
        studentId: studentId
      },
    });
    if (existLibraryMembership) {
      return context.json(
        "404 Error: Student already has a library membership.", 404);
    }     

    const libraryMembership = await prisma.libraryMembership.create({
      data: {
        studentId: studentId,
        issueDate: issueDate,
        expiryDate: expiryDate,
      },
    });

    return context.json(libraryMembership, 200);
  } catch (error) {
    console.error("Error creating library membership: ", error);
    return context.json("404 Error: Unable to create library membership", 404);
  }
});

//14. Updates the library membership details of the specified student.
app.patch("/students/:studentId/library-membership", async (context) => {
  const {studentId} = context.req.param();
  const { issueDate, expiryDate } = await context.req.json();

  try {

    const existStudent = await prisma.student.findUnique({
      where: {
        id: studentId
      },
    });
    if (!existStudent) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const existLibraryMembership = await prisma.libraryMembership.findUnique({
      where: {
        studentId: studentId
      },
    });
    if (!existLibraryMembership) {
      return context.json(
        "404 Error: Unable to find library membership data.",
        404
      );
    }

    const updatedLibraryMembership = await prisma.libraryMembership.update({
      where: {
        studentId: studentId
      },
      data: {
        issueDate: issueDate,
        expiryDate: expiryDate,
      },
    });

    return context.json(updatedLibraryMembership, 200);
  } catch (error) {
    console.error("Error updating library membership: ", error);
    return context.json("404 Error: Unable to update library membership", 404);
  }
});

//15. Deletes the library membership of the specified student.
app.delete("/students/:studentId/library-membership", async (context) => {
  const {studentId} = context.req.param();

  try {

    const existStudent = await prisma.student.findUnique({
      where: {
        id: studentId
      },
    });
    if (!existStudent) {
      return context.json("404 Error: Unable to find student data.", 404);
    }

    const existLibraryMembership = await prisma.libraryMembership.findUnique({
      where: {
        studentId: studentId
      },
    });
    if (!existLibraryMembership) {
      return context.json("404 Error: Unable to find library membership data.", 404);
    };

    const deletedLibraryMembership = await prisma.libraryMembership.delete({
      where: {
        studentId: studentId
      },
    });

    return context.json({ "Deleted Library Membership": deletedLibraryMembership }, 200);

  } catch (error) {
    console.error("Error deleting library membership:", error);
    return context.json("404 Error: Unable to delete library membership", 404);
  }
});


serve(app);