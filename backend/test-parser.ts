import { PrismaClient } from "@prisma/client";
import { parseTemplate } from "./template-parser";

const prisma = new PrismaClient();

async function main() {
  const template = await prisma.whatsappTemplate.findFirst({
    where: {
      name: "zap_01",
    },
  });

  if (!template) {
    console.log("Template não encontrado.");
    return;
  }

  const parsed = parseTemplate(template.components as any);

  console.log("\n=== TEMPLATE PARSEADO ===\n");
  console.dir(parsed, {
    depth: null,
    colors: true,
  });
}

main()
  .catch((error) => {
    console.error("\nERRO NO TESTE:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
