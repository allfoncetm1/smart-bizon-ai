import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

/**
 * Fetches a project and verifies the session's user owns it (admins bypass
 * the check). Returns null if the project doesn't exist or belongs to
 * someone else — callers should treat that as a 404 to avoid leaking
 * whether a given projectId exists at all.
 */
export async function getOwnedProject(projectId: string, session: SessionPayload) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return null;
  if (project.userId !== session.userId && !session.isAdmin) return null;
  return project;
}

/**
 * Same check when you only have a projectId and don't need the full row.
 */
export async function ownsProject(projectId: string, session: SessionPayload): Promise<boolean> {
  if (session.isAdmin) {
    const exists = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
    return !!exists;
  }
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  return !!project && project.userId === session.userId;
}
