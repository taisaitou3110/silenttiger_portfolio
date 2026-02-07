"use client";

import { useContext, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { FinancialContext, AppState, DetailItem } from '@/app/contexts/FinancialContext';

// ヘルパー関数
const toHankaku = (str: string): string => {
  if (typeof str !== 'string') return '';
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)).replace(/[^0-9.-]/g, '');
};

const formatCurrency = (value: number) => new Intl.NumberFormat('ja-JP').format(Math.round(value));

const DetailPage = () => {
  const params = useParams();
  const sectionKey = params.slug as keyof AppState;
  const { state, dispatch } = useContext(FinancialContext);
  const [activeInput, setActiveInput] = useState<string | null>(null); // for item amount inputs

  // セクションが見つからない場合、エラー表示またはリダイレクト
  if (!sectionKey || !state[sectionKey] || sectionKey === 'taxRate') { // taxRateは内訳がないため除外
    return (
      <div className="p-8 text-center text-red-500">
        <p>指定されたセクションが見つからないか、内訳編集に対応していません。</p>
        <Link href="/" className="text-blue-600 hover:underline mt-4 block">P/Lダッシュボードに戻る</Link>
      </div>
    );
  }

  const currentSection = state[sectionKey];

  const handleItemAmountChange = (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const sanitizedValue = toHankaku(value.replace(/,/g, ''));
    dispatch({
      type: 'UPDATE_ITEM_AMOUNT',
      payload: {
        section: sectionKey,
        itemId: itemId,
        amount: parseFloat(sanitizedValue) || 0,
      },
    });
  };

  const getSectionTitle = (key: keyof AppState): string => {
    switch (key) {
      case 'revenue': return '売上高';
      case 'cogs': return '売上原価';
      case 'sga': return '販売費及び一般管理費';
      case 'nonOpIncome': return '営業外収益';
      case 'nonOpExpenses': return '営業外費用';
      case 'specialIncome': return '特別利益';
      case 'specialLosses': return '特別損失';
      default: return '詳細';
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-6 bg-white rounded-lg shadow-md mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{getSectionTitle(sectionKey)}の内訳</h2>
        <Link href="/" className="text-blue-600 hover:underline">P/Lダッシュボードに戻る</Link>
      </div>

      <div className="space-y-3 mb-6">
        {currentSection.items.map((item) => {
          const displayValue = activeInput === `item-${item.id}` ? item.amount : (item.amount || 0).toLocaleString('ja-JP');
          return (
            <div key={item.id} className="flex justify-between items-center py-1">
              <span className="text-gray-700">{item.name}</span>
              <input
                type={activeInput === `item-${item.id}` ? 'number' : 'text'}
                value={displayValue}
                onChange={(e) => handleItemAmountChange(item.id, e)}
                onFocus={() => setActiveInput(`item-${item.id}`)}
                onBlur={() => setActiveInput(null)}
                className="w-1/2 p-1 border border-gray-300 rounded-md text-right focus:ring-2 focus:ring-blue-500"
              />
            </div>
          );
        })}
        <div className="border-t pt-3 mt-3 flex justify-between items-center font-bold">
          <span className="text-gray-800">合計</span>
          <span className="text-right text-gray-900">{formatCurrency(currentSection.total)}</span>
        </div>
      </div>
    </div>
  );
};

export default DetailPage;