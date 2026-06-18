import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: "postgresql://postgres:password@localhost:5432/smart_bizon",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Удаляем в правильном порядке (сначала связанные записи)
  const old = await prisma.project.findUnique({ where: { bizonId: "208416" } });
  if (old) {
    await prisma.agentConfig.deleteMany({ where: { projectId: old.id } });
    await prisma.lead.deleteMany({ where: { projectId: old.id } });
    await prisma.project.delete({ where: { id: old.id } });
    console.log("Старый проект удалён.");
  }

  const project = await prisma.project.create({
    data: {
      name: "Bizon365 Рабочий",
      bizonId: "175423",
      apiToken: "HmGsnPUWfGeBXXi3wU-ffeSQNshDI-fMlS7rshvUbMMgrQ8snvL-Gfe",
      agentConfig: {
        create: {
          isActive: true,
          moderationEnabled: true,
          filterSpam: true,
          filterMat: true,
          filterToxic: true,
          autoAnswersEnabled: true,
          hotScoreThreshold: 70,
          warmScoreThreshold: 40,
        },
      },
    },
  });

  console.log("Новый проект создан! ID:", project.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
