import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const deleted = await prisma.$transaction([
    prisma.webinarAnalytics.deleteMany({}),
    prisma.chatMessage.deleteMany({}),
    prisma.participant.deleteMany({}),
    prisma.lead.deleteMany({}),
    prisma.webinar.deleteMany({}),
  ]);
  console.log("Очищено. Теперь запусти анализ вебинара заново в /webinars");
}

main().catch(console.error).finally(() => prisma.$disconnect());
