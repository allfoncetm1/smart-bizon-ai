import { prisma } from "@/lib/prisma";
import type { EffectiveSession } from "@/lib/auth";

/**
 * Fetches a project and verifies the session's (effective — see
 * EffectiveSession) user owns it. Returns null if the project doesn't exist
 * or belongs to someone else — callers should treat that as a 404 to avoid
 * leaking whether a given projectId exists at all.
 *
 * Admins don't get a blanket bypass here: to act on another account's data
 * they explicitly pick "view as" that account (see /api/auth/view-as),
 * which makes session.userId equal that account's id for the request. That
 * keeps access explicit and auditable instead of silently-always-on.
 */
export async function getOwnedProject(projectId: string, session: EffectiveSession) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project || project.userId !== session.userId) return null;
  return project;
}

/**
 * Same check when you only have a projectId and don't need the full row.
 */
export async function ownsProject(projectId: string, session: EffectiveSession): Promise<boolean> {
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
  return !!project && project.userId === session.userId;
}
