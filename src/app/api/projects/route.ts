import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  bizonId: z.string().min(1),
  apiToken: z.string().min(1),
});

export async function GET() {
  const projects = await prisma.project.findMany({
    include: {
      agentConfig: true,
      _count: { select: { webinars: true, leads: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const project = await prisma.project.create({
      data: {
        ...data,
        agentConfig: {
          create: {},
        },
      },
      include: { agentConfig: true },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Ошибка создания проекта" }, { status: 500 });
  }
}
