"use client";

import { createContext, useReducer, Dispatch, ReactNode, FC } from 'react';
import scenarios from '@/app/dashboard/scenarios/lv1.json';

// --- ゲーム定数 (Game Constants) ---
const GAME_CONSTANTS = {
  // 4月始まりに変更 (April is index 0)
  seasonalFactors: [0.9, 0.8, 0.9, 1.0, 1.1, 0.9, 1.0, 0.8, 1.6, 1.5, 1.4, 1.2],
  diceFactors: [0.6, 0.8, 1.0, 1.1, 1.3, 1.6],
  baseCustomers: 50,
  pricePerCustomer: 1500,
  staffCapacity: {
    solo: 40,
    partTime: 60, // per person
    fullTime: 100, // per person
  },
  costs: {
    partTimeWage: 80000,
    fullTimeWage: 250000,
    baseCogsRate: 0.4, // 40% of revenue
    baseSgaRate: 0.2, // 20% of revenue
  }
};

// --- 1. 型定義 (Type Definitions) ---

export interface Financials {
  cash: number; fixedAssets: number; inventory: number; liabilities: number; equity: number;
  revenue: number; cogs: number; sga: number;
  cumulativeRevenue: number; cumulativeCogs: number; cumulativeSga: number;
}

export interface GameState {
  level: number;
  turn: number; // 1-12 (1:Apr, 2:May, ..., 12:Mar)
  phase: 'event' | 'result';
  financials: Financials;
  staff: { fullTime: number; partTime: number; };
  log: string[];
  popupMessages: string[] | null; // For DQ-style popups
  modifiers: { 
    demandBonus: number;
    priceBonus: number; // for price.adjust
    sgaBonus: number; // for expense.control
    capacityBonus: number; // for capacity.bonus
    cogsRateBonus: number; // for cost.rateAdjust
  };
}

export type Action =
  | { type: 'NEXT_TURN' }
  | { type: 'MAKE_CHOICE'; payload: { choiceId: string } }
  | { type: 'CLOSE_POPUP' };

// --- 2. 初期状態 (Initial State) ---

export const initialState: GameState = {
  level: 1,
  turn: 1, // Start in April (Turn 1)
  phase: 'event',
  financials: {
    cash: 500000, fixedAssets: 100000, inventory: 0, liabilities: 0, equity: 600000,
    revenue: 0, cogs: 0, sga: 0,
    cumulativeRevenue: 0, cumulativeCogs: 0, cumulativeSga: 0,
  },
  staff: { fullTime: 0, partTime: 0, },
  log: ["ゲーム開始！4月。北国の食堂へようこそ。"],
  popupMessages: null,
  modifiers: { 
    demandBonus: 0,
    priceBonus: 0,
    sgaBonus: 0,
    capacityBonus: 0,
    cogsRateBonus: 0,
  }
};

// --- 3. Reducer ---
const monthMap = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"];
const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP').format(Math.round(value));


const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'MAKE_CHOICE': {
      const event = scenarios.find(s => s.turn === state.turn);
      const choice = event?.choices.find(c => c.id === action.payload.choiceId);
      if (!choice) return state;

      const newState = JSON.parse(JSON.stringify(state));
      let logMessage = `【${monthMap[state.turn - 1]}の選択】: ${choice.text}`;

      choice.effects.forEach((effect: any) => {
        switch (effect.type) {
          case 'cash.out':
            newState.financials.cash -= effect.amount;
            logMessage += ` / 現金 ${effect.amount} 減少`;
            break;
          case 'inventory.buy':
            const cost = effect.qty * effect.unitCost;
            newState.financials.cash -= cost;
            // Note: In a real accounting system, this would be more complex.
            // For Lv1, we'll treat inventory as an asset that gets consumed.
            newState.financials.inventory += cost; 
            logMessage += ` / 現金 ${cost} で在庫購入`;
            break;
          case 'staff.parttime':
            newState.staff.partTime += effect.count;
            logMessage += ` / バイト ${effect.count}人雇用`;
            break;
          case 'demand.baseBonus':
            newState.modifiers.demandBonus += effect.value;
            logMessage += ` / 需要ボーナス+${effect.value}`;
            break;
          case 'price.adjust':
            newState.modifiers.priceBonus += effect.value;
            logMessage += ` / 価格ボーナス+${effect.value}%`;
            break;
          case 'expense.control':
            newState.modifiers.sgaBonus += effect.value; // value is negative
            logMessage += ` / 経費ボーナス${effect.value}%`;
            break;
          case 'capacity.bonus':
            newState.modifiers.capacityBonus += effect.value;
            logMessage += ` / キャパシティ+${effect.value}人`;
            break;
          case 'cost.rateAdjust':
            newState.modifiers.cogsRateBonus += effect.value; // value is negative
            logMessage += ` / 原価率ボーナス${effect.value}%`;
            break;
        }
      });
      
      newState.log.push(logMessage);
      newState.phase = 'result';
      return newState;
    }
    
    case 'NEXT_TURN': {
      const newState = JSON.parse(JSON.stringify(state));
      const currentMonthIndex = state.turn - 1;
      const popup: string[] = [];

      const pricePerCustomer = GAME_CONSTANTS.pricePerCustomer * (1 + state.modifiers.priceBonus / 100);

      // 1. Calculate Sales
      const seasonalFactor = GAME_CONSTANTS.seasonalFactors[currentMonthIndex];
      const diceRoll = Math.floor(Math.random() * 6);
      const diceFactor = GAME_CONSTANTS.diceFactors[diceRoll];
      popup.push(`サイコロを振った...「${diceRoll + 1}」が出た！ (需要 ${diceFactor}倍)`);
      
      const potentialCustomers = Math.round(
        (GAME_CONSTANTS.baseCustomers + state.modifiers.demandBonus) * seasonalFactor * diceFactor
      );
      popup.push(`今月の潜在的な客数は ${potentialCustomers}人 だ。`);
      
      const staffCapacity = GAME_CONSTANTS.staffCapacity.solo + 
                            (state.staff.partTime * GAME_CONSTANTS.staffCapacity.partTime) +
                            (state.staff.fullTime * GAME_CONSTANTS.staffCapacity.fullTime) +
                            state.modifiers.capacityBonus;
      popup.push(`しかし、現在の人員/設備で対応できるのは ${staffCapacity}人までだ...`);

      const actualCustomers = Math.min(potentialCustomers, staffCapacity);
      const revenue = actualCustomers * pricePerCustomer;
      popup.push(`結果、${actualCustomers}人が来店し、売上は ${formatCurrency(revenue)}円 となった！`);

      // 2. Calculate Costs
      const cogsRate = GAME_CONSTANTS.costs.baseCogsRate * (1 + state.modifiers.cogsRateBonus / 100);
      const cogs = Math.min(newState.financials.inventory, revenue * cogsRate);
      popup.push(`(在庫から ${formatCurrency(cogs)}円 分の商品が消費された)`);
      newState.financials.inventory -= cogs;
      
      const laborCost = (state.staff.partTime * GAME_CONSTANTS.costs.partTimeWage) + 
                        (state.staff.fullTime * GAME_CONSTANTS.costs.fullTimeWage);
      const sgaRate = GAME_CONSTANTS.costs.baseSgaRate * (1 + state.modifiers.sgaBonus / 100);
      const sga = (revenue * sgaRate) + laborCost;
      popup.push(`売上原価として ${formatCurrency(cogs)}円、販管費として ${formatCurrency(sga)}円 がかかった。`);

      // 3. Update Financials
      const netIncome = revenue - cogs - sga;
      popup.push(`${monthMap[currentMonthIndex]}の純利益は ${formatCurrency(netIncome)}円 となった。`);

      newState.financials.cash += netIncome;
      popup.push(`これにより、現金が ${netIncome >= 0 ? '' : '-'}${formatCurrency(Math.abs(netIncome))}円 ${netIncome >= 0 ? '増えた' : '減った'}。`);

      newState.financials.revenue = revenue;
      newState.financials.cogs = cogs;
      newState.financials.sga = sga;
      newState.financials.cumulativeRevenue += revenue;
      newState.financials.cumulativeCogs += cogs;
      newState.financials.cumulativeSga += sga;
      newState.financials.equity += netIncome;

      // 4. Set Popup and Log
      newState.popupMessages = popup;
      newState.log.push(`[${monthMap[currentMonthIndex]}結果] 売上: ${formatCurrency(revenue)}, 純利益: ${formatCurrency(netIncome)}`);
      
      // 5. Advance Turn
      if (state.turn === 12) { // March
        newState.log.push("3月、決算の時だ。");
        newState.turn = 1; // Loop back to April
      } else {
        newState.turn += 1;
      }
      
      newState.phase = 'event';
      newState.modifiers = initialState.modifiers; // Reset all modifiers

      return newState;
    }

    case 'CLOSE_POPUP':
      return { ...state, popupMessages: null };

    default:
      return state;
  }
};


// --- 4. ContextとProvider ---

export const GameContext = createContext<{
  state: GameState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

export const GameProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};