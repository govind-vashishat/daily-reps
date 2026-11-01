import { cp, readdir } from "node:fs/promises";
import path from "node:path";

async function main() {
    const problemName = process.argv[2];
    if (!problemName) {
        console.error("no problem was given. usage - bun run new <problem-name>");
        process.exit(1);
    }

    const templatePath = path.resolve(import.meta.dirname, "../_template");
    const problemDir = path.resolve(import.meta.dirname, "../problems");
    const entries = await readdir(problemDir, { withFileTypes: true });

    const regex = /^\d{3}-/;
    const problemNums = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .filter((e) => regex.test(e))
        .map((e) => e.slice(0, 3))
        .map((e) => Number(e));

    const nextNum = Math.max(0, ...problemNums) + 1;
    const problemNum = nextNum.toString().padStart(3, "0");
    await cp(templatePath, path.join(problemDir, `${problemNum}-${problemName}`), {
        recursive: true,
    });
    console.log("created problem");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
