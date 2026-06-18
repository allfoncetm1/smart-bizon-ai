import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon" });
const prisma = new PrismaClient({ adapter });

// Снижаем пороги: hot 70→50, warm 40→20
// При 80 сообщениях на 80 зрителей большинство набирают 20-35 баллов
await prisma.agentConfig.updateMany({
  data: { hotScoreThreshold: 50, warmScoreThreshold: 20 },
});

console.log("✅ Пороги обновлены: горячий ≥50, тёплый ≥20");
await prisma.$disconnect();
