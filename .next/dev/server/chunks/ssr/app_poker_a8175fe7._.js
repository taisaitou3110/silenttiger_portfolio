module.exports = [
"[project]/app/poker/usePoker.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "usePoker",
    ()=>usePoker
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
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
    const [gold, setGold] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1000);
    const [deck, setDeck] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [usedCards, setUsedCards] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [currentCard, setCurrentCard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [nextCard, setNextCard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [bet, setBet] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(0);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('100G はらって ゲームを はじめよう！');
    const [gameState, setGameState] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('IDLE');
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (deck.length === 0) {
            setDeck(createFullDeck());
        }
    }, []);
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
}),
"[project]/app/poker/page.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PokerPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$usePoker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/app/poker/usePoker.tsx [app-ssr] (ecmascript)");
"use client";
;
;
function PokerPage() {
    const { gold, deck, usedCards, currentCard, nextCard, bet, message, gameState, startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$app$2f$poker$2f$usePoker$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["usePoker"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col lg:flex-row gap-6 justify-center items-start max-w-7xl mx-auto",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full lg:w-2/3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-4 mb-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex justify-between items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-2xl font-bold text-yellow-400 font-serif tracking-tighter",
                                        children: [
                                            "GOLD: ",
                                            gold,
                                            "G"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 19,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs opacity-50 font-bold",
                                        children: [
                                            "山札残り: ",
                                            deck.length,
                                            " / 54枚"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 20,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 18,
                                columnNumber: 11
                            }, this),
                            bet > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "text-red-400 mt-2 animate-pulse text-lg font-bold text-center border-t border-white/20 pt-2",
                                children: [
                                    "現在の配当: ",
                                    bet,
                                    "G"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 23,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "border-4 border-white p-6 bg-blue-900 min-h-[120px] flex items-center mb-8 relative shadow-[4px_4px_0_0_rgba(255,255,255,1)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xl leading-relaxed font-bold",
                                children: [
                                    "➤ ",
                                    message
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 31,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "absolute bottom-2 right-4 animate-bounce text-xs opacity-50",
                                children: "▼"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 32,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex justify-center gap-10 mb-12",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CardDisplay, {
                                value: currentCard,
                                label: "いま"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(CardDisplay, {
                                value: gameState === 'RESULT' || gameState === 'LOSE' ? nextCard : '?',
                                label: "つぎ"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 38,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3 max-w-sm mx-auto",
                        children: [
                            (gameState === 'IDLE' || gameState === 'LOSE') && gold >= 100 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: startNewHand,
                                        children: "ぼうけんに でる (100G)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 49,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>window.location.href = '/',
                                        children: "ゲームを やめる"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 50,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true),
                            gold < 100 && gameState !== 'PLAYING' && gameState !== 'RESULT' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                onClick: fullReset,
                                children: "復活の呪文を となえる (リセット)"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 56,
                                columnNumber: 14
                            }, this),
                            gameState === 'PLAYING' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "grid grid-cols-2 gap-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>handleGuess('HIGH'),
                                        children: "HIGH (上)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 62,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: ()=>handleGuess('LOW'),
                                        children: "LOW (下)"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 63,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 61,
                                columnNumber: 13
                            }, this),
                            gameState === 'RESULT' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: continueGame,
                                        highlight: true,
                                        children: "ダブルアップに いどむ"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 70,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                        onClick: collect,
                                        children: "ゴールドを かいしゅう"
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 71,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 69,
                                columnNumber: 13
                            }, this),
                            gameState === 'CLEAR' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(MenuButton, {
                                onClick: fullReset,
                                children: "➤ 伝説の勇者として 戻る"
                            }, void 0, false, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 45,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-full lg:w-80 border-4 border-white p-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)] self-stretch lg:self-start",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                        className: "text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest",
                        children: "でたカード記録"
                    }, void 0, false, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 84,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-1",
                        children: CARD_TYPES.map((type)=>{
                            const count = usedCards.filter((c)=>c === type).length;
                            const max = type === 'JK' ? 2 : 4;
                            const hasAppeared = count > 0;
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `flex justify-between items-center px-2 py-1 border-b border-white/10 transition-all duration-300 ${hasAppeared ? 'text-white' : 'opacity-20 text-gray-500'}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-bold w-8",
                                        children: type
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 95,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-1 flex-1 justify-center",
                                        children: [
                                            ...Array(max)
                                        ].map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `w-3 h-3 border transition-colors ${i < count ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_5px_rgba(255,255,0,0.5)]' : 'border-white/30'}`
                                            }, i, false, {
                                                fileName: "[project]/app/poker/page.tsx",
                                                lineNumber: 99,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 97,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: `text-xs ml-2 w-6 text-right ${hasAppeared ? 'text-yellow-400' : ''}`,
                                        children: count
                                    }, void 0, false, {
                                        fileName: "[project]/app/poker/page.tsx",
                                        lineNumber: 109,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, type, true, {
                                fileName: "[project]/app/poker/page.tsx",
                                lineNumber: 94,
                                columnNumber: 15
                            }, this);
                        })
                    }, void 0, false, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 87,
                        columnNumber: 9
                    }, this),
                    gold <= 0 && (gameState === 'IDLE' || gameState === 'LOSE') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 p-2 border-2 border-red-500 text-red-500 text-center animate-pulse font-bold text-xs",
                        children: "破産しました..."
                    }, void 0, false, {
                        fileName: "[project]/app/poker/page.tsx",
                        lineNumber: 117,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 83,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 12,
        columnNumber: 5
    }, this);
}
// --- サポートコンポーネント ---
function CardDisplay({ value, label }) {
    const isBack = value === '?' || value === '';
    const isJoker = value === 'JK';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-center",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-xs mb-2 text-gray-400 font-bold uppercase tracking-widest",
                children: label
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 133,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: `w-24 h-36 md:w-32 md:h-48 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-bold border-4 shadow-2xl transition-all duration-300 transform ${isBack ? 'bg-blue-700 border-white text-white' : 'bg-white text-black border-gray-400'} ${isJoker ? 'text-red-600 ring-4 ring-red-600' : ''}`,
                children: value
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 134,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 132,
        columnNumber: 5
    }, this);
}
function MenuButton({ children, onClick, highlight = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
        onClick: onClick,
        className: `w-full text-left px-6 py-4 border-2 border-transparent hover:border-white group flex items-center transition-all duration-75 bg-blue-900/40 hover:bg-blue-800 ${highlight ? 'text-yellow-400' : 'text-white'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "opacity-0 group-hover:opacity-100 mr-3 font-bold text-2xl transition-transform transform translate-x-[-4px] group-hover:translate-x-0",
                children: "➤"
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 147,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xl font-bold tracking-tight",
                children: children
            }, void 0, false, {
                fileName: "[project]/app/poker/page.tsx",
                lineNumber: 148,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/poker/page.tsx",
        lineNumber: 143,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=app_poker_a8175fe7._.js.map