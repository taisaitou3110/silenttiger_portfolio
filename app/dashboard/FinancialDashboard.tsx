"use client";

import { useContext } from 'react';
import Link from 'next/link';
import { FinancialContext, AppState, DetailItem, initialState } from '@/app/contexts/FinancialContext';

// --- ヘルパー関数 ---
const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP').format(Math.round(value));

// --- データ生成関数 ---
const generateItems = (total: number, itemNames: string[]): DetailItem[] => {
  const count = itemNames.length;
  if (count === 0) return [];
  let remaining = total;
  const amounts: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const amount = Math.floor(Math.random() * (remaining / 2));
    amounts.push(amount);
    remaining -= amount;
  }
  amounts.push(remaining);

  return itemNames.map((name, i) => ({ id: i + 1, name, amount: amounts[i] }));
};

const createRandomState = (): AppState => {
    const revenueTotal = Math.floor(Math.random() * 80000000) + 20000000;
    const cogsTotal = Math.floor(revenueTotal * (Math.random() * 0.2 + 0.4));
    const sgaTotal = Math.floor(revenueTotal * (Math.random() * 0.15 + 0.25));

    return {
        revenue: { total: revenueTotal, items: generateItems(revenueTotal, ['製品売上', 'サービス売上']) },
        cogs: { total: cogsTotal, items: generateItems(cogsTotal, ['仕入高', '材料費']) },
        sga: { total: sgaTotal, items: generateItems(sgaTotal, ['人件費', '家賃', '広告宣伝費', 'その他']) },
        nonOpIncome: { total: 0, items: initialState.nonOpIncome.items },
        nonOpExpenses: { total: 0, items: initialState.nonOpExpenses.items },
        specialIncome: { total: 0, items: initialState.specialIncome.items },
        specialLosses: { total: 0, items: initialState.specialLosses.items },
        taxRate: { total: 30, items: [] },
    };
};

const presets: { label: string; data: AppState }[] = [
    { label: '自転車店', data: {
        revenue: { total: 30000000, items: generateItems(30000000, ['完成車売上', 'パーツ売上', '修理・メンテ']) },
        cogs: { total: 18000000, items: generateItems(18000000, ['完成車仕入', 'パーツ仕入']) },
        sga: { total: 9000000, items: generateItems(9000000, ['人件費', '店舗家賃', '水道光熱費', '広告費']) },
        nonOpIncome: { total: 50000, items: generateItems(50000, ['受取利息']) },
        nonOpExpenses: { total: 150000, items: generateItems(150000, ['支払利息']) },
        specialIncome: { total: 0, items: [] }, specialLosses: { total: 0, items: [] }, taxRate: { total: 30, items: [] }
    }},
    { label: 'IT(ソフト)', data: {
        revenue: { total: 200000000, items: generateItems(200000000, ['ライセンス売上', '開発受託', '保守サポート']) },
        cogs: { total: 10000000, items: generateItems(10000000, ['サーバー費用', '外部ソフト利用料']) },
        sga: { total: 120000000, items: generateItems(120000000, ['役員報酬', '給与手当', 'オフィス家賃', '採用費', '広告宣伝費']) },
        nonOpIncome: { total: 500000, items: generateItems(500000, ['受取利息'])},
        nonOpExpenses: { total: 200000, items: generateItems(200000, ['支払利息'])},
        specialIncome: { total: 0, items: [] }, specialLosses: { total: 0, items: [] }, taxRate: { total: 30, items: [] }
    }},
];

// --- メインコンポーネント ---
// --- メインコンポーネント ---
interface FinancialDashboardProps {
  version: string;
}

const FinancialDashboard = ({ version }: FinancialDashboardProps) => {
  const { state, dispatch } = useContext(FinancialContext);

  // --- 計算ロジック ---
  const grossProfit = state.revenue.total - state.cogs.total;
  const operatingIncome = grossProfit - state.sga.total;
  const ordinaryIncome = operatingIncome + state.nonOpIncome.total - state.nonOpExpenses.total;
  const preTaxIncome = ordinaryIncome + state.specialIncome.total - state.specialLosses.total;
  const taxAmount = preTaxIncome > 0 ? preTaxIncome * (state.taxRate.total / 100) : 0;
  const netIncome = preTaxIncome - taxAmount;

  // --- レンダリング用コンポーネント ---
  const SectionRow = ({ section, label }: { section: keyof AppState; label: string }) => (
    <div className="flex justify-between items-center py-1">
      <Link href={`/details/${section}`} className="text-blue-600 hover:underline">{label}</Link>
      <span className="text-right font-mono">{formatCurrency(state[section].total)}</span>
    </div>
  );

  const ResultRow = ({ label, value, isBold = false }: { label: string; value: number; isBold?: boolean }) => (
    <div className={`flex justify-between items-center py-2 ${isBold ? 'font-bold' : ''}`}>
      <span className="text-gray-800">{label}</span>
      <span className={`text-right font-mono ${value >= 0 ? 'text-gray-900' : 'text-red-600'}`}>{formatCurrency(value)}</span>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        損益計算（P/L）ダッシュボード <span className="text-sm font-normal text-gray-500 ml-2">v{version}</span>
      </h2>
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => dispatch({ type: 'SET_ENTIRE_STATE', payload: createRandomState() })} className="bg-indigo-500 text-white py-1 px-3 rounded-md hover:bg-indigo-600 transition text-xs">ランダム</button>
        {presets.map(p => <button key={p.label} onClick={() => dispatch({ type: 'SET_ENTIRE_STATE', payload: p.data })} className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 transition text-xs">{p.label}</button>)}
      </div>

      <div className="space-y-2">
        <SectionRow section="revenue" label="売上高" />
        <SectionRow section="cogs" label="売上原価" />
        <div className="border-t pt-2 mt-2">
          <ResultRow label="売上総利益" value={grossProfit} isBold />
        </div>
        <div className="pt-2">
          <SectionRow section="sga" label="販売費及び一般管理費" />
        </div>
        <div className="border-t pt-2 mt-2">
          <ResultRow label="営業利益" value={operatingIncome} isBold />
        </div>
        <div className="pt-2">
          <SectionRow section="nonOpIncome" label="営業外収益" />
          <SectionRow section="nonOpExpenses" label="営業外費用" />
        </div>
        <div className="border-t pt-2 mt-2">
          <ResultRow label="経常利益" value={ordinaryIncome} isBold />
        </div>
        <div className="pt-2">
            <SectionRow section="specialIncome" label="特別利益" />
            <SectionRow section="specialLosses" label="特別損失" />
        </div>
        <div className="border-t pt-2 mt-2">
          <ResultRow label="税引前当期純利益" value={preTaxIncome} />
        </div>
        <div className="pt-2">
          <div className="flex justify-between items-center py-1 text-gray-600">
            <span>法人税等 (税率: {state.taxRate.total}%)</span>
            <span className="text-right font-mono">- {formatCurrency(taxAmount)}</span>
          </div>
        </div>
        <div className="border-t-2 border-gray-800 pt-3 mt-3">
          <ResultRow label="当期純利益" value={netIncome} isBold />
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;