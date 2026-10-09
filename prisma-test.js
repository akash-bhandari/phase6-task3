const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'prisma-test@example.com' },
    update: {},
    create: { name: 'Prisma Test User', email: 'prisma-test@example.com' },
  });
  console.log('Sample user:', user);

  const post = await prisma.post.create({
    data: { title: 'Testing Prisma schema', authorId: user.id },
  });
  console.log('Sample post:', post);

  const comment = await prisma.comment.create({
    data: { text: 'Prisma insert works', postId: post.id, authorId: user.id },
  });
  console.log('Sample comment:', comment);

  // Confirm relations resolve correctly
  const postWithComments = await prisma.post.findUnique({
    where: { id: post.id },
    include: { comments: true, author: true },
  });
  console.log('\nPost with relations resolved:', JSON.stringify(postWithComments, null, 2));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});