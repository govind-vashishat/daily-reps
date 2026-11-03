export async function promisePool<T>(
    tasks: ReadonlyArray<() => Promise<T>>,
    limit: number,
): Promise<T[]> {
    const results: T[] = [];
    const pool = new Set<unknown>();
    if (!Number.isInteger(limit) || limit < 1) {
        throw new RangeError("Limit must be a positive integer.");
    }

    for (const [i, task] of tasks.entries()) {
        if(pool.size >= limit) {
            await Promise.race(pool);
        }

        const taskPromise = task();

        const executePromise = taskPromise.then((response) => {
            results[i] = response;
        }).finally(() => {
            pool.delete(executePromise);
        })

        pool.add(executePromise);
    }

    await Promise.all(pool);
    console.log(results);
    return results;
}

const tasks = [
    () => new Promise((resolve) => {
        setTimeout(() => {
            resolve("Task 1 resolved")
        }, 300);
    }),
    () => new Promise((resolve) => {
        setTimeout(() => {
            resolve("Task 2 resolved")
        }, 200);
    }),
    () => new Promise((resolve) => {
        setTimeout(() => {
            resolve("Task 3 resolved");
        }, 300);
    }),
]

const limit = 2;

await promisePool(tasks, limit);