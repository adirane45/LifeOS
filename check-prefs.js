const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    const user = await prisma.user.findFirst();
    if (user) {
      console.log('User preferences:', JSON.stringify(user.preferences, null, 2));
    } else {
      console.log('No user found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
})();
