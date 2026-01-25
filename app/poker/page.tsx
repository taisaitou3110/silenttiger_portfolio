"use client";
import React, { useEffect, useState } from 'react'; // Import useEffect and useState
import { usePoker } from './usePoker';
import { addAchiever, getAchievers } from './actions'; // Import the new actions

// Define a type for Achiever for better type safety
interface Achiever {
  id: string;
  name: string;
  finalGold: number;
  achievedAt: string; // Assuming it's returned as a string
}

export default function PokerPage() {
  const [selectedStartGold, setSelectedStartGold] = useState(5000); // Default to 5000G
  const [selectedInitialBet, setSelectedInitialBet] = useState(100); // Default to 100G

  const {
    gold, deck, usedCards, currentCard, nextCard, bet, message, gameState,
    startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES,
    startGold, setStartGold, currentBetAmount, setCurrentBetAmount // Destructure setters
  } = usePoker(selectedStartGold, selectedInitialBet); // Pass selected values

  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [achieverNameInput, setAchieverNameInput] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchAchievers = async () => {
      const result = await getAchievers();
      if (result.success && result.data) { // Ensure data exists
        setAchievers(result.data);
      } else {
        console.error("Failed to fetch achievers:", result.error);
      }
    };
    fetchAchievers();
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmitAchiever = async () => {
    setSubmitMessage('Submitting...');
    // Basic client-side validation before sending to server action
    if (!/^[A-Z]{1,4}$/.test(achieverNameInput)) {
      setSubmitMessage('Error: Name must be 1 to 4 uppercase alphabetic characters.');
      return;
    }

    const result = await addAchiever(achieverNameInput.toUpperCase(), gold); // Pass 'gold' here
    if (result.success && result.data) { // Ensure data exists
      setSubmitMessage('Successfully registered!');
      // Update local state and sort by achievedAt for display
      setAchievers(prev => 
        [...prev, result.data].sort((a, b) => 
          new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime()
        )
      );
      setAchieverNameInput(''); // Clear input
    } else {
      setSubmitMessage(`Error: ${result.error}`);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-mono select-none flex flex-col lg:flex-row gap-6 justify-center items-start max-w-7xl mx-auto">
      
      {/* メインゲームエリア (幅 約2/3) */}
      <div className="w-full lg:w-2/3">
        {/* ステータスウィンドウ */}
        <div className="border-4 border-white p-4 mb-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-bold text-yellow-400 font-serif tracking-tighter">GOLD: {gold}G</span>
            <span className="text-xs opacity-50 font-bold">山札残り: {deck.length} / 54枚</span>
          </div>
          {bet > 0 && (
            <div className="text-red-400 mt-2 animate-pulse text-lg font-bold text-center border-t border-white/20 pt-2">
              現在の配当: {bet}G
            </div>
          )}
        </div>

        {/* メッセージウィンドウ */}
        <div className="border-4 border-white p-6 bg-blue-900 min-h-[120px] flex items-center mb-8 relative shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
          <p className="text-xl leading-relaxed font-bold">➤ {message}</p>
          <div className="absolute bottom-2 right-4 animate-bounce text-xs opacity-50">▼</div>
        </div>

        {/* カード表示エリア */}
        <div className="flex justify-center gap-10 mb-12">
          <CardDisplay value={currentCard} label="いま" />
          <CardDisplay 
            value={(gameState === 'RESULT' || gameState === 'LOSE') ? nextCard : '?'} 
            label="つぎ" 
          />
        </div>

        {/* 操作コマンド */}
        <div className="space-y-3 max-w-sm mx-auto">
          {/* ゲーム開始前、または負けた後 */}
          {(gameState === 'IDLE' || gameState === 'LOSE') && gold >= selectedInitialBet && ( // Use selectedInitialBet here
            <>
              {/* Start Gold Selection */}
              <div className="space-y-2">
                <h4 className="text-yellow-400 font-bold text-center">開始ゴールドを選択:</h4>
                <div className="flex justify-center gap-4">
                  {[5000, 2000, 500].map(amount => (
                    <MenuButton 
                      key={amount} 
                      onClick={() => {
                        setSelectedStartGold(amount);
                        setStartGold(amount); // Update usePoker's internal state
                      }}
                      highlight={selectedStartGold === amount}
                    >
                      {amount}G
                    </MenuButton>
                  ))}
                </div>
              </div>

              {/* Initial Bet Selection */}
              <div className="space-y-2 mt-4">
                <h4 className="text-yellow-400 font-bold text-center">初回ベット額を選択:</h4>
                <div className="flex justify-center gap-4">
                  {[100, 500, 1000].map(amount => (
                    <MenuButton 
                      key={amount} 
                      onClick={() => {
                        setSelectedInitialBet(amount);
                        setCurrentBetAmount(amount); // Update usePoker's internal state
                      }}
                      highlight={selectedInitialBet === amount}
                    >
                      {amount}G
                    </MenuButton>
                  ))}
                </div>
              </div>

              <MenuButton onClick={startNewHand}>ぼうけんに でる ({currentBetAmount}G)</MenuButton> {/* Use currentBetAmount */}
              <MenuButton onClick={() => window.location.href = '/'}>ゲームを やめる</MenuButton>
            </>
          )}

          {/* 破産時 */}
          {gold < selectedInitialBet && gameState !== 'PLAYING' && gameState !== 'RESULT' && ( // Use selectedInitialBet here
             <MenuButton onClick={fullReset}>復活の呪文を となえる (リセット)</MenuButton>
          )}

          {/* HIGH/LOW 選択中 */}
          {gameState === 'PLAYING' && (
            <div className="grid grid-cols-2 gap-4">
              <MenuButton onClick={() => handleGuess('HIGH')}>HIGH (上)</MenuButton>
              <MenuButton onClick={() => handleGuess('LOW')}>LOW (下)</MenuButton>
            </div>
          )}

          {/* 当たり判定後 */}
          {gameState === 'RESULT' && (
            <div className="flex flex-col gap-3">
              <MenuButton onClick={continueGame} highlight>ダブルアップに いどむ</MenuButton>
              <MenuButton onClick={collect}>ゴールドを かいしゅう</MenuButton>
            </div>
          )}

          {/* 10,000G クリア時 */}
          {gameState === 'CLEAR' && (
            <div className="flex flex-col gap-3">
              <div className="border-4 border-yellow-400 p-4 bg-yellow-900 text-yellow-50 text-center font-bold text-xl mb-4 shadow-[4px_4px_0_0_rgba(252,211,77,1)]">
                10000G 達成おめでとう！
              </div>
              <input
                type="text"
                placeholder="名前 (4文字以内, 大文字英字)"
                className="w-full p-3 bg-gray-700 text-white border-2 border-gray-600 focus:border-yellow-400 outline-none uppercase text-center"
                maxLength={4}
                value={achieverNameInput}
                onChange={(e) => setAchieverNameInput(e.target.value.toUpperCase())}
              />
              <MenuButton onClick={handleSubmitAchiever} highlight>
                ランキングに登録
              </MenuButton>
              {submitMessage && <p className="text-center text-sm mt-2">{submitMessage}</p>}
              <MenuButton onClick={fullReset}>➤ 伝説の勇者として 戻る</MenuButton>
            </div>
          )}
        </div>
      </div>

      {/* 右側：履歴エリア + ランキングエリア (幅 約1/3) */}
      <div className="w-full lg:w-1/3 flex flex-col gap-6">
        {/* 履歴エリア */}
        <div className="border-4 border-white p-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)]">
          <h3 className="text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest">
            でたカード記録
          </h3>
          <div className="space-y-1">
            {CARD_TYPES.map(type => {
              const count = usedCards.filter(c => c === type).length;
              const max = type === 'JK' ? 2 : 4;
              const hasAppeared = count > 0;
              
              return (
                <div key={type} className={`flex justify-between items-center px-2 py-1 border-b border-white/10 transition-all duration-300 ${hasAppeared ? 'text-white' : 'opacity-20 text-gray-500'}`}>
                  <span className="font-bold w-8">{type}</span>
                  {/* 履歴のドット表示 */}
                  <div className="flex gap-1 flex-1 justify-center">
                    {[...Array(max)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-3 h-3 border transition-colors ${
                          i < count 
                            ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_5px_rgba(255,255,0,0.5)]' 
                            : 'border-white/30'
                        }`} 
                      />
                    ))}
                  </div>
                  <span className={`text-xs ml-2 w-6 text-right ${hasAppeared ? 'text-yellow-400' : ''}`}>
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
          {gold <= 0 && (gameState === 'IDLE' || gameState === 'LOSE') && (
            <div className="mt-6 p-2 border-2 border-red-500 text-red-500 text-center animate-pulse font-bold text-xs">
              破産しました...
            </div>
          )}
        </div>

        {/* ランキングエリア */}
        <div className="border-4 border-white p-4 bg-blue-900 shadow-[4px_4px_0_0_rgba(255,255,255,1)] self-stretch">
          <h3 className="text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest">
            10000G 達成者ランキング
          </h3>
          {achievers.length === 0 ? (
            <p className="text-center text-gray-400">まだ達成者はいません。</p>
          ) : (
            <ol className="list-decimal list-inside space-y-1">
              {achievers.map((achiever, index) => (
                <li key={achiever.id} className="flex justify-between items-center py-1 border-b border-white/10 last:border-b-0">
                  <span className="font-bold text-lg">{index + 1}. {achiever.name}</span>
                  <span className="text-yellow-400 text-base">{achiever.finalGold}G</span>
                  <span className="text-sm text-gray-400 ml-2">
                    {/* Display date with time and minutes */}
                    {new Date(achiever.achievedAt).toLocaleString('ja-JP', { // Using 'ja-JP' for locale, can be changed
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false // 24-hour format
                    })}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

// --- サポートコンポーネント ---

function CardDisplay({ value, label }: { value: string, label: string }) {
  const isBack = value === '?' || value === '';
  const isJoker = value === 'JK';
  return (
    <div className="text-center">
      <div className="text-xs mb-2 text-gray-400 font-bold uppercase tracking-widest">{label}</div>
      <div className={`w-24 h-36 md:w-32 md:h-48 rounded-xl flex items-center justify-center text-4xl md:text-5xl font-bold border-4 shadow-2xl transition-all duration-300 transform ${isBack ? 'bg-blue-700 border-white text-white' : 'bg-white text-black border-gray-400'} ${isJoker ? 'text-red-600 ring-4 ring-red-600' : ''}`}>
        {value}
      </div>
    </div>
  );
}

function MenuButton({ children, onClick, highlight = false }: { children: React.ReactNode, onClick: () => void, highlight?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left px-6 py-4 border-2 border-transparent hover:border-white group flex items-center transition-all duration-75 bg-blue-900/40 hover:bg-blue-800 ${highlight ? 'text-yellow-400' : 'text-white'}`}
    >
      <span className="opacity-0 group-hover:opacity-100 mr-3 font-bold text-2xl transition-transform transform translate-x-[-4px] group-hover:translate-x-0">➤</span>
      <span className="text-xl font-bold tracking-tight">{children}</span>
    </button>
  );
}
