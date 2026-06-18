import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon" });
const prisma = new PrismaClient({ adapter });

const project = await prisma.project.findFirst({ include: { agentConfig: true } });
console.log("AgentConfig:", JSON.stringify(project?.agentConfig, null, 2));
await prisma.$disconnect();
