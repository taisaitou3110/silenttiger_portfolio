module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/contexts/FinancialContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FinancialContext",
    ()=>FinancialContext,
    "FinancialProvider",
    ()=>FinancialProvider,
    "initialState",
    ()=>initialState
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
// --- 初期状態 ---
const createInitialSection = (name, count = 5)=>({
        total: 0,
        items: Array.from({
            length: count
        }, (_, i)=>({
                id: i + 1,
                name: `${name} ${i + 1}`,
                amount: 0
            }))
    });
const initialState = {
    revenue: createInitialSection('売上項目'),
    cogs: createInitialSection('原価項目'),
    sga: createInitialSection('販管費項目'),
    nonOpIncome: createInitialSection('営業外収益項目', 2),
    nonOpExpenses: createInitialSection('営業外費用項目', 2),
    specialIncome: createInitialSection('特別利益項目', 2),
    specialLosses: createInitialSection('特別損失項目', 2),
    taxRate: {
        total: 30,
        items: []
    }
};
// --- Reducer ---
const financialReducer = (state, action)=>{
    switch(action.type){
        case 'SET_ENTIRE_STATE':
            return action.payload;
        case 'UPDATE_ITEM_AMOUNT':
            {
                const { section, itemId, amount } = action.payload;
                const targetSection = state[section];
                // アイテムの金額を更新
                const updatedItems = targetSection.items.map((item)=>item.id === itemId ? {
                        ...item,
                        amount
                    } : item);
                // 新しい合計値を計算
                const newTotal = updatedItems.reduce((sum, item)=>sum + item.amount, 0);
                return {
                    ...state,
                    [section]: {
                        ...targetSection,
                        items: updatedItems,
                        total: newTotal
                    }
                };
            }
        case 'UPDATE_SECTION_TOTAL':
            {
                const { section, total } = action.payload;
                // NOTE: このActionは詳細ページのロジックを簡略化するために用意するが、
                // 本来は詳細アイテムの変更が合計値に反映されるのが一方向で望ましい。
                // 今回は簡略化のため、合計値の直接更新も可能にする。
                return {
                    ...state,
                    [section]: {
                        ...state[section],
                        total: total
                    }
                };
            }
        default:
            return state;
    }
};
const FinancialContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])({
    state: initialState,
    dispatch: ()=>null
});
const FinancialProvider = ({ children })=>{
    const [state, dispatch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"])(financialReducer, initialState);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(FinancialContext.Provider, {
        value: {
            state,
            dispatch
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/contexts/FinancialContext.tsx",
        lineNumber: 114,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    else {
        if ("TURBOPACK compile-time truthy", 1) {
            if ("TURBOPACK compile-time truthy", 1) {
                module.exports = __turbopack_context__.r("[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)");
            } else //TURBOPACK unreachable
            ;
        } else //TURBOPACK unreachable
        ;
    }
} //# sourceMappingURL=module.compiled.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime; //# sourceMappingURL=react-jsx-dev-runtime.js.map
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].React; //# sourceMappingURL=react.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__37057003._.js.map