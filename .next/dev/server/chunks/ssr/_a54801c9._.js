module.exports = [
"[project]/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const prismaClientSingleton = ()=>{
    // Ensure DATABASE_URL is set. In Next.js, this is typically handled by
    // environment variables loaded from .env.local, etc.
    // If not set, PrismaClient will throw an error when trying to connect,
    // which is preferable to an undefined 'prisma' object.
    return new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]();
};
const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();
const __TURBOPACK__default__export__ = prisma;
if ("TURBOPACK compile-time truthy", 1) globalThis.prismaGlobal = prisma;
}),
"[project]/app/poker/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"00ba1b7e12ba232d78e9432a6aeae8f52cfd8c26e0":"getAchievers","6065710c8c11ada75cf33df625aa07246d096d081b":"addAchiever"},"",""] */ __turbopack_context__.s([
    "addAchiever",
    ()=>addAchiever,
    "getAchievers",
    ()=>getAchievers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function addAchiever(name, gold) {
    // Validate name: 4 uppercase alphabetic characters
    if (!/^[A-Z]{1,4}$/.test(name)) {
        return {
            error: "Name must be 1 to 4 uppercase alphabetic characters."
        };
    }
    // Enforce gold cap
    let cappedGold = gold;
    if (cappedGold > 65535) {
        cappedGold = 65535;
    }
    if (cappedGold < 0) {
        cappedGold = 0;
    }
    try {
        const newAchiever = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].pokerAchiever.create({
            data: {
                name,
                finalGold: cappedGold
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/poker"); // Revalidate the poker page to show updated ranking
        return {
            success: true,
            data: newAchiever
        };
    } catch (error) {
        if (error.code === 'P2002') {
            return {
                error: `Achiever with name '${name}' already exists.`
            };
        }
        console.error("Error adding poker achiever:", error);
        return {
            error: "Failed to add achiever."
        };
    }
}
async function getAchievers() {
    try {
        const achievers = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["default"].pokerAchiever.findMany({
            orderBy: {
                achievedAt: "asc"
            },
            take: 10
        });
        return {
            success: true,
            data: achievers
        };
    } catch (error) {
        console.error("Error fetching poker achievers:", error);
        return {
            error: "Failed to fetch achievers."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    addAchiever,
    getAchievers
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(addAchiever, "6065710c8c11ada75cf33df625aa07246d096d081b", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getAchievers, "00ba1b7e12ba232d78e9432a6aeae8f52cfd8c26e0", null);
}),
"[project]/.next-internal/server/app/poker/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/poker/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/poker/actions.ts [app-rsc] (ecmascript)");
;
;
}),
"[project]/.next-internal/server/app/poker/page/actions.js { ACTIONS_MODULE0 => \"[project]/app/poker/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "00ba1b7e12ba232d78e9432a6aeae8f52cfd8c26e0",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getAchievers"],
    "6065710c8c11ada75cf33df625aa07246d096d081b",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["addAchiever"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$poker$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$app$2f$poker$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/poker/page/actions.js { ACTIONS_MODULE0 => "[project]/app/poker/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/poker/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=_a54801c9._.js.map