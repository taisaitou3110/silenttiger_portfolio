"use client";

import { useContext, useState, useEffect } from 'react';
import { GameContext } from '../contexts/GameContext';
import scenarios from '@/app/dashboard/scenarios/lv1.json';

const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP').format(Math.round(value));
const monthMap = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];

// --- Child Components ---

const PLStatement = () => {
  const { state } = useContext(GameContext);
  const { cumulativeRevenue, cumulativeCogs, cumulativeSga } = state.financials;
  const grossProfit = cumulativeRevenue - cumulativeCogs;
  const operatingIncome = grossProfit - cumulativeSga;
  // Simplified for now, doesn't include non-op income/expenses or tax
  const netIncome = operatingIncome;

  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-inner">
      <h3 className="text-lg font-bold mb-3 border-b border-gray-600 pb-2">年間 損益計算書 (P/L)</h3>
      <div className="space-y-1 font-mono text-xs">
        <div className="flex justify-between"><span>売上高</span><span>{formatCurrency(cumulativeRevenue)}</span></div>
        <div className="flex justify-between"><span>売上原価</span><span>({formatCurrency(cumulativeCogs)})</span></div>
        <div className="flex justify-between font-bold border-t border-gray-700 pt-1"><span>売上総利益</span><span>{formatCurrency(grossProfit)}</span></div>
        <div className="flex justify-between mt-2"><span>販管費</span><span>({formatCurrency(cumulativeSga)})</span></div>
        <div className="flex justify-between font-bold border-t border-gray-700 pt-1"><span>営業利益</span><span>{formatCurrency(operatingIncome)}</span></div>
        <div className="flex justify-between font-bold text-green-400 text-sm border-t-2 border-green-400 mt-2 pt-1"><span>当期純利益</span><span>{formatCurrency(netIncome)}</span></div>
      </div>
    </div>
  )
}

const FinancialStatementDisplay = () => {
  const { state } = useContext(GameContext);
  const { financials } = state;
  return (
    <div className="bg-gray-800 text-white p-4 rounded-lg shadow-inner">
      <h3 className="text-lg font-bold mb-3 border-b border-gray-600 pb-2">貸借対照表 (B/S)</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs">
        <span className="font-bold text-green-400">現金</span>
        <span className="text-right text-green-400">{formatCurrency(financials.cash)}</span>
        <span className="pl-4">在庫</span>
        <span className="text-right">{formatCurrency(financials.inventory)}</span>
        <span className="pl-4">固定資産</span>
        <span className="text-right">{formatCurrency(financials.fixedAssets)}</span>
        <span className="font-bold">負債</span>
        <span className="text-right">{formatCurrency(financials.liabilities)}</span>
        <span className="font-bold">純資産</span>
        <span className="text-right">{formatCurrency(financials.equity)}</span>
      </div>
    </div>
  );
};

const EventDisplay = () => {
    const { state, dispatch } = useContext(GameContext);
    const event = scenarios.find(s => s.turn === state.turn);
  
    if (!event) {
      return <div className="text-center p-8 bg-white rounded-lg shadow-md">年度末です。次の年度の準備をしています...</div>;
    }
  
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{monthMap[state.turn - 1]}</h2>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">{event.title}</h3>
        <p className="text-gray-600 mb-6">{event.body}</p>
        <div className="space-y-3">
          {event.choices.map(choice => (
            <button
              key={choice.id}
              onClick={() => dispatch({ type: 'MAKE_CHOICE', payload: { choiceId: choice.id } })}
              className="w-full text-left bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <p className="font-bold">{choice.text}</p>
              <p className="text-sm text-blue-100 mt-1">{choice.hint}</p>
            </button>
          ))}
        </div>
      </div>
    );
};

const ResultDisplay = () => {
    const { dispatch } = useContext(GameContext);
    
    return (
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">月の活動終了</h2>
        <p className="text-gray-600 mb-6">結果を確認して、次の月に進みましょう。</p>
        <button
          onClick={() => dispatch({ type: 'NEXT_TURN' })}
          className="bg-green-500 text-white font-bold py-3 px-8 rounded-full hover:bg-green-600 transition duration-300 shadow-lg"
        >
          結果を見る
        </button>
      </div>
    );
};

const DQStylePopup = () => {
  const { state, dispatch } = useContext(GameContext);
  const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

  useEffect(() => {
    if (state.popupMessages) {
      setVisibleMessages([]);
      let index = 0;
      const interval = setInterval(() => {
        if (index < state.popupMessages!.length) {
          setVisibleMessages(prev => [...prev, state.popupMessages![index]]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [state.popupMessages]);

  if (!state.popupMessages) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-black border-4 border-yellow-600 text-white font-bold p-6 rounded-lg max-w-lg w-full text-lg leading-relaxed shadow-xl">
        <div className="h-64 space-y-4 overflow-y-auto p-2 font-mono">
          {visibleMessages.map((msg, i) => (
            <p key={i} className="tracking-wider">{msg}</p>
          ))}
        </div>
        <button 
          onClick={() => dispatch({type: 'CLOSE_POPUP'})}
          className="mt-6 w-full bg-yellow-600 text-black py-2 rounded-md hover:bg-yellow-500 transition-colors font-sans"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};

// --- Main Game Component ---
const NorthCountryDinerGame = () => {
  const { state } = useContext(GameContext);

  return (
    <div className="bg-gray-100 min-h-screen p-4 sm:p-6 md:p-8">
      <DQStylePopup />
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
            北国食堂 〜数字で生き残れ〜
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <main className="lg:col-span-2">
            {state.phase === 'event' ? <EventDisplay /> : <ResultDisplay />}
          </main>

          <aside className="space-y-6">
            <FinancialStatementDisplay />
            <PLStatement />
            <div className="bg-gray-900 text-white p-4 rounded-lg shadow-inner h-48 overflow-y-auto font-mono text-xs">
              <h3 className="font-bold mb-2 text-gray-400">ゲームログ</h3>
              <ul>
                {state.log.slice().reverse().map((entry, index) => (
                  <li key={index} className="border-b border-gray-700 py-1 opacity-80">{entry}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default NorthCountryDinerGame;