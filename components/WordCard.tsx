import React from 'react';
import { AppIcons } from './AppIcons'; // Import AppIcons
import { UI_TOKENS } from './designToken'; // Import UI_TOKENS

/**
 * 3. 抽出されたコンポーネント: 単語カード
 */
interface WordCardProps {
  word: string;
  definition: string;
  level: number;
  onDelete: () => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, definition, level, onDelete }) => (
  <div className={UI_TOKENS.CARD}>
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-3">
        <AppIcons.GripVertical size={20} className="text-slate-300 cursor-grab" />
        <div>
          <span className={UI_TOKENS.TEXT.CAPTION}>Level {level}</span>
          <h3 className="text-2xl font-bold text-indigo-700">{word}</h3>
        </div>
      </div>
      <button onClick={onDelete} className={UI_TOKENS.BUTTON.DANGER} title="削除">
        <AppIcons.Trash2 size={18} />
      </button>
    </div>
    <p className={UI_TOKENS.TEXT.BODY}>{definition}</p>
    <div className="mt-6 flex justify-end">
      <button className="text-indigo-600 font-bold flex items-center text-sm hover:underline">
        詳細を見る <AppIcons.ChevronRight size={16} />
      </button>
    </div>
  </div>
);
