import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon" });
const prisma = new PrismaClient({ adapter });

const project = await prisma.project.findFirst();
if (!project) { console.log("Проект не найден"); process.exit(1); }

await prisma.agentConfig.upsert({
  where: { projectId: project.id },
  create: {
    projectId: project.id,
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

console.log("✅ Telegram настроен: chat ID 6371272028");
await prisma.$disconnect();
