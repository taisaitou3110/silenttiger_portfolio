"use client";

import { createContext, useReducer, Dispatch, ReactNode, FC } from 'react';

// --- 型定義 ---
export interface DetailItem {
  id: number;
  name: string;
  amount: number;
}

export interface FinancialSection {
  total: number;
  items: DetailItem[];
}

// アプリケーション全体のステートの型
export interface AppState {
  revenue: FinancialSection;
  cogs: FinancialSection;
  sga: FinancialSection;
  nonOpIncome: FinancialSection;
  nonOpExpenses: FinancialSection;
  specialIncome: FinancialSection;
  specialLosses: FinancialSection;
  taxRate: { total: number; items: [] }; // taxRateはtotalのみ使用
}

// Actionの型定義
export type Action =
  | { type: 'SET_ENTIRE_STATE'; payload: AppState }
  | { type: 'UPDATE_ITEM_AMOUNT'; payload: { section: keyof AppState; itemId: number; amount: number } }
  | { type: 'UPDATE_SECTION_TOTAL'; payload: { section: keyof AppState, total: number } };

// --- 初期状態 ---
const createInitialSection = (name: string, count = 5): FinancialSection => ({
  total: 0,
  items: Array.from({ length: count }, (_, i) => ({ id: i + 1, name: `${name} ${i + 1}`, amount: 0 })),
});

export const initialState: AppState = {
  revenue: createInitialSection('売上項目'),
  cogs: createInitialSection('原価項目'),
  sga: createInitialSection('販管費項目'),
  nonOpIncome: createInitialSection('営業外収益項目', 2),
  nonOpExpenses: createInitialSection('営業外費用項目', 2),
  specialIncome: createInitialSection('特別利益項目', 2),
  specialLosses: createInitialSection('特別損失項目', 2),
  taxRate: { total: 30, items: [] },
};


// --- Reducer ---
const financialReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_ENTIRE_STATE':
      return action.payload;

    case 'UPDATE_ITEM_AMOUNT': {
      const { section, itemId, amount } = action.payload;
      const targetSection = state[section];
      
      // アイテムの金額を更新
      const updatedItems = targetSection.items.map(item =>
        item.id === itemId ? { ...item, amount } : item
      );

      // 新しい合計値を計算
      const newTotal = updatedItems.reduce((sum, item) => sum + item.amount, 0);

      return {
        ...state,
        [section]: {
          ...targetSection,
          items: updatedItems,
          total: newTotal,
        },
      };
    }
    
    case 'UPDATE_SECTION_TOTAL': {
        const { section, total } = action.payload;
        // NOTE: このActionは詳細ページのロジックを簡略化するために用意するが、
        // 本来は詳細アイテムの変更が合計値に反映されるのが一方向で望ましい。
        // 今回は簡略化のため、合計値の直接更新も可能にする。
        return {
            ...state,
            [section]: {
                ...state[section],
                total: total,
            }
        }
    }

    default:
      return state;
  }
};

// --- Contextの作成 ---
export const FinancialContext = createContext<{
  state: AppState;
  dispatch: Dispatch<Action>;
}>({
  state: initialState,
  dispatch: () => null,
});

// --- Providerコンポーネント ---
export const FinancialProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(financialReducer, initialState);

  return (
    <FinancialContext.Provider value={{ state, dispatch }}>
      {children}
    </FinancialContext.Provider>
  );
};
