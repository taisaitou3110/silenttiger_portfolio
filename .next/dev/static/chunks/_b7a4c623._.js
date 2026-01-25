(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/app/poker/usePoker.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePoker",
    ()=>usePoker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
"use client";
;
// カードの強さ順（JOKERを最強に設定）
const CARD_TYPES = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
    'JK'
];
function usePoker() {
    _s();
    const [gold, setGold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1000);
    const [deck, setDeck] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [usedCards, setUsedCards] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentCard, setCurrentCard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [nextCard, setNextCard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [bet, setBet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('100G はらって ゲームを はじめよう！');
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('IDLE');
    // 54枚の山札を生成する関数
    const createFullDeck = ()=>{
        const newDeck = [];
        // 2〜Aまでを4枚ずつ追加
        CARD_TYPES.slice(0, 13).forEach((type)=>{
            for(let i = 0; i < 4; i++)newDeck.push(type);
        });
        // ジョーカーを2枚追加
        newDeck.push('JK');
        newDeck.push('JK');
        return newDeck.sort(()=>Math.random() - 0.5);
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "usePoker.useEffect": ()=>{
            if (deck.length === 0) {
                setDeck(createFullDeck());
            }
        }
    }["usePoker.useEffect"], []);
    const pullCard = (currentDeck)=>{
        let tempDeck = [
            ...currentDeck
        ];
        if (tempDeck.length === 0) {
            // 山札が切れたらその場で新しく生成
            tempDeck = createFullDeck();
            setUsedCards([]);
            setMessage("山札が なくなったので あたらしく つくった！");
        }
        const card = tempDeck.pop();
        setDeck(tempDeck);
        return card;
    };
    const startNewHand = ()=>{
        if (gold < 100) return;
        setGold((prev)=>prev - 100);
        const card = pullCard(deck);
        setCurrentCard(card);
        setUsedCards((prev)=>[
                ...prev,
                card
            ]);
        setBet(100);
        setGameState('PLAYING');
        setMessage(`スライムは ${card} をだした！ 上か？下か？`);
    };
    const handleGuess = (guess)=>{
        const newCard = pullCard(deck);
        setNextCard(newCard);
        setUsedCards((prev)=>[
                ...prev,
                newCard
            ]);
        const currentIndex = CARD_TYPES.indexOf(currentCard);
        const nextIndex = CARD_TYPES.indexOf(newCard);
        if (currentIndex === nextIndex) {
            setMessage(`引き分けだ！ ${currentCard} のまま やり直し！`);
        } else if (guess === 'HIGH' && nextIndex > currentIndex || guess === 'LOW' && nextIndex < currentIndex) {
            setBet((prev)=>prev * 2);
            setMessage(`当たり！ 配当が ${bet * 2}G になった！`);
            setGameState('RESULT');
        } else {
            setBet(0);
            setGameState('LOSE');
            setMessage(`残念！ 全てを失った… (${newCard} だった！)`);
        }
    };
    const collect = ()=>{
        const newTotal = gold + bet;
        setGold(newTotal);
        setBet(0);
        if (newTotal >= 10000) {
            setGameState('CLEAR');
            setMessage(`10000G 到達！ おめでとう！ お前の完全勝利だ！`);
        } else {
            setGameState('IDLE');
            setMessage(`${bet}G 獲得！ 次はどうする？`);
        }
    };
    const continueGame = ()=>{
        setCurrentCard(nextCard);
        setNextCard('');
        setGameState('PLAYING');
        setMessage(`${nextCard} より 上か？下か？`);
    };
    const fullReset = ()=>{
        setGold(1000);
        setDeck(createFullDeck());
        setUsedCards([]);
        setBet(0);
        setGameState('IDLE');
        setMessage('100G はらって ゲームを はじめよう！');
    };
    return {
        gold,
        deck,
        usedCards,
        currentCard,
        nextCard,
        bet,
        message,
        gameState,
        startNewHand,
        handleGuess,
        collect,
        continueGame,
        fullReset,
        CARD_TYPES
    };
}
_s(usePoker, "hCBUFpbxFNzKsb86zyRzONmkAZw=");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/app/poker/data:cb23dd [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "addAchiever",
    ()=>$$RSC_SERVER_ACTION_0
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"4065710c8c11ada75cf33df625aa07246d096d081b":"addAchiever"},"app/poker/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_0 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("4065710c8c11ada75cf33df625aa07246d096d081b", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "addAchiever");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHByaXNtYSBmcm9tIFwiQC9saWIvcHJpc21hXCI7XG5pbXBvcnQgeyByZXZhbGlkYXRlUGF0aCB9IGZyb20gXCJuZXh0L2NhY2hlXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRBY2hpZXZlcihuYW1lOiBzdHJpbmcpIHtcbiAgLy8gVmFsaWRhdGUgbmFtZTogNCB1cHBlcmNhc2UgYWxwaGFiZXRpYyBjaGFyYWN0ZXJzXG4gIGlmICghL15bQS1aXXsxLDR9JC8udGVzdChuYW1lKSkge1xuICAgIHJldHVybiB7IGVycm9yOiBcIk5hbWUgbXVzdCBiZSAxIHRvIDQgdXBwZXJjYXNlIGFscGhhYmV0aWMgY2hhcmFjdGVycy5cIiB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBuZXdBY2hpZXZlciA9IGF3YWl0IHByaXNtYS5wb2tlckFjaGlldmVyLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGZpbmFsR29sZDogMTAwMDAsIC8vIEV4cGxpY2l0bHkgc2V0IGFzIHBlciByZXF1aXJlbWVudFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXZhbGlkYXRlUGF0aChcIi9wb2tlclwiKTsgLy8gUmV2YWxpZGF0ZSB0aGUgcG9rZXIgcGFnZSB0byBzaG93IHVwZGF0ZWQgcmFua2luZ1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5ld0FjaGlldmVyIH07XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ1AyMDAyJykgeyAvLyBVbmlxdWUgY29uc3RyYWludCB2aW9sYXRpb25cbiAgICAgIHJldHVybiB7IGVycm9yOiBgQWNoaWV2ZXIgd2l0aCBuYW1lICcke25hbWV9JyBhbHJlYWR5IGV4aXN0cy5gIH07XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhZGRpbmcgcG9rZXIgYWNoaWV2ZXI6XCIsIGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWlsZWQgdG8gYWRkIGFjaGlldmVyLlwiIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFjaGlldmVycygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhY2hpZXZlcnMgPSBhd2FpdCBwcmlzbWEucG9rZXJBY2hpZXZlci5maW5kTWFueSh7XG4gICAgICBvcmRlckJ5OiB7XG4gICAgICAgIGFjaGlldmVkQXQ6IFwiYXNjXCIsIC8vIE9yZGVyIGJ5IGFjaGlldmVtZW50IGRhdGUsIG9sZGVzdCBmaXJzdFxuICAgICAgfSxcbiAgICAgIHRha2U6IDEwLCAvLyBHZXQgdG9wIDEwIGFjaGlldmVycywgYWRqdXN0IGFzIG5lZWRlZFxuICAgIH0pO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGFjaGlldmVycyB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBwb2tlciBhY2hpZXZlcnM6XCIsIGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWlsZWQgdG8gZmV0Y2ggYWNoaWV2ZXJzLlwiIH07XG4gIH1cbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Im9SQUtzQix3TEFBQSJ9
}),
"[project]/app/poker/data:d56a5d [app-client] (ecmascript) <text/javascript>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAchievers",
    ()=>$$RSC_SERVER_ACTION_1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
/* __next_internal_action_entry_do_not_use__ [{"00ba1b7e12ba232d78e9432a6aeae8f52cfd8c26e0":"getAchievers"},"app/poker/actions.ts",""] */ "use turbopack no side effects";
;
const $$RSC_SERVER_ACTION_1 = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("00ba1b7e12ba232d78e9432a6aeae8f52cfd8c26e0", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "getAchievers");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
 //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vYWN0aW9ucy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJcInVzZSBzZXJ2ZXJcIjtcblxuaW1wb3J0IHByaXNtYSBmcm9tIFwiQC9saWIvcHJpc21hXCI7XG5pbXBvcnQgeyByZXZhbGlkYXRlUGF0aCB9IGZyb20gXCJuZXh0L2NhY2hlXCI7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhZGRBY2hpZXZlcihuYW1lOiBzdHJpbmcpIHtcbiAgLy8gVmFsaWRhdGUgbmFtZTogNCB1cHBlcmNhc2UgYWxwaGFiZXRpYyBjaGFyYWN0ZXJzXG4gIGlmICghL15bQS1aXXsxLDR9JC8udGVzdChuYW1lKSkge1xuICAgIHJldHVybiB7IGVycm9yOiBcIk5hbWUgbXVzdCBiZSAxIHRvIDQgdXBwZXJjYXNlIGFscGhhYmV0aWMgY2hhcmFjdGVycy5cIiB9O1xuICB9XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBuZXdBY2hpZXZlciA9IGF3YWl0IHByaXNtYS5wb2tlckFjaGlldmVyLmNyZWF0ZSh7XG4gICAgICBkYXRhOiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGZpbmFsR29sZDogMTAwMDAsIC8vIEV4cGxpY2l0bHkgc2V0IGFzIHBlciByZXF1aXJlbWVudFxuICAgICAgfSxcbiAgICB9KTtcbiAgICByZXZhbGlkYXRlUGF0aChcIi9wb2tlclwiKTsgLy8gUmV2YWxpZGF0ZSB0aGUgcG9rZXIgcGFnZSB0byBzaG93IHVwZGF0ZWQgcmFua2luZ1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IG5ld0FjaGlldmVyIH07XG4gIH0gY2F0Y2ggKGVycm9yOiBhbnkpIHtcbiAgICBpZiAoZXJyb3IuY29kZSA9PT0gJ1AyMDAyJykgeyAvLyBVbmlxdWUgY29uc3RyYWludCB2aW9sYXRpb25cbiAgICAgIHJldHVybiB7IGVycm9yOiBgQWNoaWV2ZXIgd2l0aCBuYW1lICcke25hbWV9JyBhbHJlYWR5IGV4aXN0cy5gIH07XG4gICAgfVxuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBhZGRpbmcgcG9rZXIgYWNoaWV2ZXI6XCIsIGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWlsZWQgdG8gYWRkIGFjaGlldmVyLlwiIH07XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFjaGlldmVycygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBhY2hpZXZlcnMgPSBhd2FpdCBwcmlzbWEucG9rZXJBY2hpZXZlci5maW5kTWFueSh7XG4gICAgICBvcmRlckJ5OiB7XG4gICAgICAgIGFjaGlldmVkQXQ6IFwiYXNjXCIsIC8vIE9yZGVyIGJ5IGFjaGlldmVtZW50IGRhdGUsIG9sZGVzdCBmaXJzdFxuICAgICAgfSxcbiAgICAgIHRha2U6IDEwLCAvLyBHZXQgdG9wIDEwIGFjaGlldmVycywgYWRqdXN0IGFzIG5lZWRlZFxuICAgIH0pO1xuICAgIHJldHVybiB7IHN1Y2Nlc3M6IHRydWUsIGRhdGE6IGFjaGlldmVycyB9O1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBmZXRjaGluZyBwb2tlciBhY2hpZXZlcnM6XCIsIGVycm9yKTtcbiAgICByZXR1cm4geyBlcnJvcjogXCJGYWlsZWQgdG8gZmV0Y2ggYWNoaWV2ZXJzLlwiIH07XG4gIH1cbn0iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6InFSQTZCc0IseUxBQUEifQ==
}),
"[project]/app/poker/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PokerPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"); // Import useEffect and useState
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$usePoker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/poker/usePoker.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$data$3a$cb23dd__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/app/poker/data:cb23dd [app-client] (ecmascript) <text/javascript>"); // Import the new actions
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$data$3a$d56a5d__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/app/poker/data:d56a5d [app-client] (ecmascript) <text/javascript>");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function PokerPage() {
    _s();
    const { gold, deck, usedCards, currentCard, nextCard, bet, message, gameState, startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$usePoker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePoker"])();
    const [achievers, setAchievers] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [achieverNameInput, setAchieverNameInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [submitMessage, setSubmitMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "PokerPage.useEffect": ()=>{
            const fetchAchievers = {
                "PokerPage.useEffect.fetchAchievers": async ()=>{
                    const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$data$3a$d56a5d__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["getAchievers"])();
                    if (result.success && result.data) {
                        setAchievers(result.data);
                    } else {
                        console.error("Failed to fetch achievers:", result.error);
                    }
                }
            }["PokerPage.useEffect.fetchAchievers"];
            fetchAchievers();
        }
    }["PokerPage.useEffect"], []); // Empty dependency array means this runs once on mount
    const handleSubmitAchiever = async ()=>{
        setSubmitMessage('Submitting...');
        // Basic client-side validation before sending to server action
        if (!/^[A-Z]{1,4}$/.test(achieverNameInput)) {
            setSubmitMessage('Error: Name must be 1 to 4 uppercase alphabetic characters.');
            return;
        }
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$data$3a$cb23dd__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["addAchiever"])(achieverNameInput.toUpperCase());
        if (result.success && result.data) {
            setSubmitMessage('Successfully registered!');
            // Update local state and sort by achievedAt for display
            setAchievers((prev)=>[
                    ...prev,
                    result.data
                ].sort((a, b)=>new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()));
            setAchieverNameInput(''); // Clear input
        } else {
            setSubmitMessage(`Error: ${result.error}`);
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col lg:flex-row gap-6 justify-center items-start max-w-7xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full lg:w-2/3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-4 mb-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-2xl font-bold text-yellow-400 font-serif tracking-tighter",
                                        children: [
                                            "GOLD: ",
                                            gold,
                                            "G"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 67,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs opacity-50 font-bold",
                                        children: [
                                            "山札残り: ",
                                            deck.length,
                                            " / 54枚"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 68,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            bet > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-red-400 mt-2 animate-pulse text-lg font-bold text-center border-t border-white/20 pt-2",
                                children: [
                                    "現在の配当: ",
                                    bet,
                                    "G"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-6 bg-blue-900 min-h-[120px] flex items-center mb-8 relative shadow-[4px_4px_0_0_rgba(255,255,255,1)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl leading-relaxed font-bold",
                                children: [
                                    "➤ ",
                                    message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 79,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-2 right-4 animate-bounce text-xs opacity-50",
                                children: "▼"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 80,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 78,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center gap-10 mb-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CardDisplay, {
                                value: currentCard,
                                label: "いま"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 85,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(CardDisplay, {
                                value: gameState === 'RESULT' || gameState === 'LOSE' ? nextCard : '?',
                                label: "つぎ"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 86,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3 max-w-sm mx-auto",
                        children: [
                            (gameState === 'IDLE' || gameState === 'LOSE') && gold >= 100 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: startNewHand,
                                        children: "ぼうけんに でる (100G)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>window.location.href = '/',
                                        children: "ゲームを やめる"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 98,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            gold < 100 && gameState !== 'PLAYING' && gameState !== 'RESULT' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                onClick: fullReset,
                                children: "復活の呪文を となえる (リセット)"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 104,
                                columnNumber: 14
                            }, this),
                            gameState === 'PLAYING' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>handleGuess('HIGH'),
                                        children: "HIGH (上)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 110,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>handleGuess('LOW'),
                                        children: "LOW (下)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 111,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 109,
                                columnNumber: 13
                            }, this),
                            gameState === 'RESULT' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: continueGame,
                                        highlight: true,
                                        children: "ダブルアップに いどむ"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 118,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: collect,
                                        children: "ゴールドを かいしゅう"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 119,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 117,
                                columnNumber: 13
                            }, this),
                            gameState === 'CLEAR' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "border-4 border-yellow-400 p-4 bg-yellow-900 text-yellow-50 text-center font-bold text-xl mb-4 shadow-[4px_4px_0_0_rgba(252,211,77,1)]",
                                        children: "10000G 達成おめでとう！"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 126,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        placeholder: "名前 (4文字以内, 大文字英字)",
                                        className: "w-full p-3 bg-gray-700 text-white border-2 border-gray-600 focus:border-yellow-400 outline-none uppercase text-center",
                                        maxLength: 4,
                                        value: achieverNameInput,
                                        onChange: (e)=>setAchieverNameInput(e.target.value.toUpperCase())
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 129,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: handleSubmitAchiever,
                                        highlight: true,
                                        children: "ランキングに登録"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 137,
                                        columnNumber: 15
                                    }, this),
                                    submitMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-center text-sm mt-2",
                                        children: submitMessage
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 140,
                                        columnNumber: 33
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: fullReset,
                                        children: "➤ 伝説の勇者として 戻る"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 141,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 125,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 93,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 63,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full lg:w-1/3 flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest",
                                children: "でたカード記録"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 151,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-1",
                                children: CARD_TYPES.map((type)=>{
                                    const count = usedCards.filter((c)=>c === type).length;
                                    const max = type === 'JK' ? 2 : 4;
                                    const hasAppeared = count > 0;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `flex justify-between items-center px-2 py-1 border-b border-white/10 transition-all duration-300 ${hasAppeared ? 'text-white' : 'opacity-20 text-gray-500'}`,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold w-8",
                                                children: type
                                            }, void 0, false, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 162,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-1 flex-1 justify-center",
                                                children: [
                                                    ...Array(max)
                                                ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `w-3 h-3 border transition-colors ${i < count ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_5px_rgba(255,255,0,0.5)]' : 'border-white/30'}`
                                                    }, i, false, {
                                                        fileName: "[project]/app/poker/page.tsx",
                                                        lineNumber: 166,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 164,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `text-xs ml-2 w-6 text-right ${hasAppeared ? 'text-yellow-400' : ''}`,
                                                children: count
                                            }, void 0, false, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 176,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, type, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 161,
                                        columnNumber: 17
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 154,
                                columnNumber: 11
                            }, this),
                            gold <= 0 && (gameState === 'IDLE' || gameState === 'LOSE') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-6 p-2 border-2 border-red-500 text-red-500 text-center animate-pulse font-bold text-xs",
                                children: "破産しました..."
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 184,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 150,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)] self-stretch",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest",
                                children: "10000G 達成者ランキング"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 192,
                                columnNumber: 11
                            }, this),
                            achievers.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-center text-gray-400",
                                children: "まだ達成者はいません。"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 196,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ol", {
                                className: "list-decimal list-inside space-y-1",
                                children: achievers.map((achiever, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "flex justify-between items-center py-1 border-b border-white/10 last:border-b-0",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold text-lg",
                                                children: [
                                                    index + 1,
                                                    ". ",
                                                    achiever.name
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 201,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-yellow-400 text-base",
                                                children: [
                                                    achiever.finalGold,
                                                    "G"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 202,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-gray-400 ml-2",
                                                children: new Date(achiever.achievedAt).toLocaleDateString()
                                            }, void 0, false, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 203,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, achiever.id, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 200,
                                        columnNumber: 17
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 198,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 191,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 148,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 60,
        columnNumber: 5
    }, this);
}
_s(PokerPage, "NyOobOBT+OaCl8rxetEuWus7w48=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$usePoker$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePoker"]
    ];
});
_c = PokerPage;
// --- サポートコンポーネント ---
function CardDisplay({ value, label }) {
    const isBack = value === '?' || value === '';
    const isJoker = value === 'JK';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs mb-2 text-gray-400 font-bold uppercase tracking-widest",
                children: label
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 223,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `w-24 h-36 md:w-32 md:h-48 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-bold border-4 shadow-2xl transition-all duration-300 transform ${isBack ? 'bg-blue-700 border-white text-white' : 'bg-white text-black border-gray-400'} ${isJoker ? 'text-red-600 ring-4 ring-red-600' : ''}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 224,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 222,
        columnNumber: 5
    }, this);
}
_c1 = CardDisplay;
function MenuButton({ children, onClick, highlight = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: onClick,
        className: `w-full text-left px-6 py-4 border-2 border-transparent hover:border-white group flex items-center transition-all duration-75 bg-blue-900/40 hover:bg-blue-800 ${highlight ? 'text-yellow-400' : 'text-white'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "opacity-0 group-hover:opacity-100 mr-3 font-bold text-2xl transition-transform transform translate-x-[-4px] group-hover:translate-x-0",
                children: "➤"
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 237,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xl font-bold tracking-tight",
                children: children
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 238,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 233,
        columnNumber: 5
    }, this);
}
_c2 = MenuButton;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PokerPage");
__turbopack_context__.k.register(_c1, "CardDisplay");
__turbopack_context__.k.register(_c2, "MenuButton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This file must be bundled in the app's client layer, it shouldn't be directly
// imported by the server.
Object.defineProperty(exports, "__esModule", {
    value: true
});
0 && (module.exports = {
    callServer: null,
    createServerReference: null,
    findSourceMapURL: null
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    callServer: function() {
        return _appcallserver.callServer;
    },
    createServerReference: function() {
        return _client.createServerReference;
    },
    findSourceMapURL: function() {
        return _appfindsourcemapurl.findSourceMapURL;
    }
});
const _appcallserver = __turbopack_context__.r("[project]/node_modules/next/dist/client/app-call-server.js [app-client] (ecmascript)");
const _appfindsourcemapurl = __turbopack_context__.r("[project]/node_modules/next/dist/client/app-find-source-map-url.js [app-client] (ecmascript)");
const _client = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react-server-dom-turbopack/client.js [app-client] (ecmascript)"); //# sourceMappingURL=action-client-wrapper.js.map
}),
]);

//# sourceMappingURL=_b7a4c623._.js.map