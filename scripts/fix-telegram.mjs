import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon" });
const prisma = new PrismaClient({ adapter });

const correctProjectId = "cmqjfe9vv0000r8kre5kmigjt";

await prisma.agentConfig.upsert({
  where: { projectId: correctProjectId },
  create: {
    projectId: correctProjectId,
    isActive: true,
    telegramEnabled: true,
    telegramChatId: "6371272028",
    notifyOnHotLead: true,
    notifyOnPurchase: true,
    moderationEnabled: true,
    hotScoreThreshold: 70,
    warmScoreThreshold: 40,
  },
  update: {
    telegramEnabled: true,
    telegramChatId: "6371272028",
    notifyOnHotLead: true,
    notifyOnPurchase: true,
  },
});

console.log("✅ Telegram перенесён на правильный проект 175423");

// Проверка
const p = await prisma.project.findUnique({ where: { id: correctProjectId }, include: { agentConfig: true } });
console.log("tgEnabled:", p?.agentConfig?.telegramEnabled, "| chatId:", p?.agentConfig?.telegramChatId);

await prisma.$disconnect();
