export async function promisePool<T>(
    tasks: ReadonlyArray<() => Promise<T>>,
    limit: number,
): Promise<T[]> {
    const results: T[] = [];
    const pool = new Set();
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
    return results;
}