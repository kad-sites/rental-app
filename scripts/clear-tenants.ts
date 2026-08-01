import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all Invoices...');
  await prisma.invoice.deleteMany({});
  
  console.log('Clearing all Tenants...');
  await prisma.tenant.deleteMany({});

  console.log('Successfully cleared all Tenants and Invoices!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
