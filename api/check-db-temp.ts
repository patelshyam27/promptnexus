
import { prisma } from './db';

async function main() {
    try {
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({
            select: { username: true, id: true, isAdmin: true, createdAt: true }
        });

        const promptCount = await prisma.prompt.count();
        const prompts = await prisma.prompt.findMany({
            select: { title: true, authorId: true, createdAt: true }
        });

        console.log(`\n--- DB STATUS ---`);
        console.log(`Total Users: ${userCount}`);
        console.table(users);
        console.log(`\nTotal Prompts: ${promptCount}`);
        console.table(prompts);
        console.log(`-----------------\n`);
    } catch (e) {
        console.error("DB Check Failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
