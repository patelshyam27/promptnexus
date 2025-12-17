
import { PrismaClient } from '@prisma/client';

// This string mimics exactly what should be in Vercel
// Using the POOLER host: aws-1-ap-south-1.pooler.supabase.com
// Using the POOLER user: postgres.qekfomgakmugzwtfmxzr
// Using the ENCODED password: Shyam%40271106
const connectionString = "postgresql://postgres.qekfomgakmugzwtfmxzr:Shyam%40271106@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: connectionString,
        },
    },
});

async function main() {
    console.log("Testing Pooler Connection...");
    console.log(`URL: ${connectionString}`);

    try {
        const count = await prisma.user.count();
        console.log(`Connection SUCCESS! Found ${count} users.`);

        // Also check prompts to verify schema
        const promptCount = await prisma.prompt.count();
        console.log(`Found ${promptCount} prompts.`);

    } catch (e) {
        console.error("Connection FAILED.");
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
