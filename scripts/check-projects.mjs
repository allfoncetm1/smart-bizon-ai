import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon" });
const prisma = new PrismaClient({ adapter });

const projects = await prisma.project.findMany({ include: { agentConfig: true } });
for (const p of projects) {
  console.log(`Project: ${p.id} | bizonId: ${p.bizonId} | hasConfig: ${!!p.agentConfig} | tgEnabled: ${p.agentConfig?.telegramEnabled} | tgChat: ${p.agentConfig?.telegramChatId}`);
}
await prisma.$disconnect();
