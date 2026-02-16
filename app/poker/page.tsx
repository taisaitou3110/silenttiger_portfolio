"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image'; // Import Image component
import { usePoker } from '@/app/poker/usePoker';
import { GoldStatus } from '@/components/GoldStatus';
import { addAchiever, getAchievers } from '@/app/poker/actions';
import { getUserGoldData, addGold } from '@/lib/actions';

interface Achiever {
  id: string;
  name: string;
  finalGold: number;
  achievedAt: string;
}

interface PokerPageProps {
  version: string; // Add version prop
}

const INITIAL_BET = 100;



export default function PokerPage({ version }: PokerPageProps) {

  const [initialGoldLoaded, setInitialGoldLoaded] = useState(false);
  const [userGold, setUserGold] = useState(0);
  const [goldBonusMessage, setGoldBonusMessage] = useState<string | null>(null);

  const {
    gold, deck, usedCards, currentCard, nextCard, bet, message, gameState,
    startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES,
    initializeGame, currentBetAmount
  } = usePoker();

  const [achievers, setAchievers] = useState<Achiever[]>([]);
  const [achieverNameInput, setAchieverNameInput] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    const fetchAchievers = async () => {
      const result = await getAchievers();
      if (result.success && result.data) {
        setAchievers(result.data);
      } else {
        console.error("Failed to fetch achievers:", result.error);
      }
    };
    fetchAchievers();
  }, []);

  useEffect(() => {
    const fetchAndSetGold = async () => {
      const { gold } = await getUserGoldData();
      let currentGold = gold;

      if (currentGold < 100) {
        await addGold(100);
        currentGold += 100;
        setGoldBonusMessage("100ゴールドこっそりもらってゲームスタート");
      }
      setUserGold(currentGold);
      setInitialGoldLoaded(true);
    };

    fetchAndSetGold();
  }, []);

  const handleSubmitAchiever = async () => {
    setSubmitMessage('Submitting...');
    if (!/^[A-Z]{1,4}$/.test(achieverNameInput)) {
      setSubmitMessage('Error: Name must be 1 to 4 uppercase alphabetic characters.');
      return;
    }
    const result = await addAchiever(achieverNameInput.toUpperCase(), gold);
    if (result.success && result.data) {
      setSubmitMessage('Successfully registered!');
      setAchievers(prev => 
        [...prev, result.data].sort((a, b) => b.finalGold - a.finalGold)
      );
      setAchieverNameInput('');
    } else {
      setSubmitMessage(`Error: ${result.error}`);
    }
  };

  // Welcome Screen
  if (gameState === 'UNINITIALIZED') {
    if (!initialGoldLoaded) {
      return (
        <div className="relative min-h-screen w-screen overflow-hidden text-white font-mono select-none flex flex-col justify-center items-center">
          <p className="text-xl">Loading gold...</p>
        </div>
      );
    }
    return (
      <div className="relative min-h-screen w-screen overflow-hidden text-white font-mono select-none flex flex-col justify-center items-center">
        <Image
          src="/images/image_background_poker.png"
          alt="ポーカー背景"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
        />
        <div className="relative z-10 w-full max-w-lg text-center p-4">
          <div className="border-4 border-white p-6 bg-blue-900/70 shadow-[4px_4px_0_0_rgba(255,255,255,1)] rounded-lg mb-8 backdrop-blur-sm">
            <h1 className="text-2xl font-bold mb-4">ハイ＆ロー ポーカー <span className="text-sm font-normal text-gray-400 ml-2">v{version}</span></h1>
            <p className="text-lg leading-relaxed">手持ちのゴールドを増やして10000Gを目指せ！</p>
            {goldBonusMessage && (
              <p className="text-yellow-300 font-bold mt-2 animate-bounce">{goldBonusMessage}</p>
            )}
          </div>
          <div className="space-y-6">
            <MenuButton 
              onClick={() => initializeGame(userGold, 100)} 
              highlight={userGold >= 100}
              disabled={userGold < 100}
            >
              掛け金100Gでゲームを始める
            </MenuButton>
            <MenuButton 
              onClick={() => initializeGame(userGold, 500)} 
              highlight={userGold >= 500}
              disabled={userGold < 500}
            >
              掛け金500Gでゲームを始める
            </MenuButton>
            <MenuButton 
              onClick={() => initializeGame(userGold, 1000)} 
              highlight={userGold >= 1000}
              disabled={userGold < 1000}
            >
              掛け金1000Gでゲームを始める
            </MenuButton>
            <MenuButton onClick={() => window.location.href = '/'}>トップにもどる</MenuButton>
          </div>
        </div>
      </div>
    );
  }

  // Main Game Screen
  return (
    <div className="relative min-h-screen w-screen overflow-hidden text-white font-mono select-none flex flex-col justify-center items-center p-4">
       <Image
          src="/images/image_background_poker.png"
          alt="ポーカー背景"
          layout="fill"
          objectFit="cover"
          className="z-0"
          priority
        />
      <div className="relative z-10 flex flex-col lg:flex-row gap-6 justify-center items-start max-w-7xl mx-auto backdrop-blur-sm bg-black/50 p-6 rounded-lg">
        <div className="w-full lg:w-2/3">
          <div className="border-4 border-white p-4 mb-4 bg-blue-900/70 shadow-[4px_4px_0_0_rgba(255,255,255,1)] rounded-lg">
            <h1 className="text-2xl font-bold text-yellow-400 font-serif tracking-tighter mb-2">ハイ＆ロー ポーカー <span className="text-sm font-normal text-gray-400 ml-2">v{version}</span></h1>
            <div className="flex justify-between items-center">

            </div>
            {bet > 0 && (
              <div className="text-red-400 mt-2 animate-pulse text-lg font-bold text-center border-t border-white/20 pt-2">
                現在の配当: {bet}G
              </div>
            )}
          </div>

          <div className="flex justify-center gap-10 mb-12">
            <CardDisplay value={currentCard} label="いま" />
            <CardDisplay 
              value={(gameState === 'RESULT' || gameState === 'LOSE') ? nextCard : '?'} 
              label="つぎ" 
            />
          </div>

          <div className="space-y-3 max-w-sm mx-auto">
            {(gameState === 'IDLE' || gameState === 'LOSE') && gold >= currentBetAmount && (
              <>
                <MenuButton onClick={startNewHand}>ぼうけんに でる ({currentBetAmount}G)</MenuButton>
                <MenuButton onClick={() => window.location.href = '/'}>ゲームを やめる</MenuButton>
              </>
            )}

            {gold < currentBetAmount && gameState !== 'PLAYING' && gameState !== 'RESULT' && (
              <MenuButton onClick={fullReset}>復活の呪文を となえる (リセット)</MenuButton>
            )}

            {gameState === 'PLAYING' && (
              <div className="grid grid-cols-2 gap-4">
                <MenuButton onClick={() => handleGuess('HIGH')}>HIGH (上)</MenuButton>
                <MenuButton onClick={() => handleGuess('LOW')}>LOW (下)</MenuButton>
              </div>
            )}

            {gameState === 'RESULT' && (
              <div className="flex flex-col gap-3">
                <MenuButton onClick={continueGame} highlight>ダブルアップに いどむ</MenuButton>
                <MenuButton onClick={collect}>ゴールドを かいしゅう</MenuButton>
              </div>
            )}

            {gameState === 'CLEAR' && (
              <div className="flex flex-col gap-3">
                <div className="border-4 border-yellow-400 p-4 bg-yellow-900/70 text-yellow-50 text-center font-bold text-xl mb-4 shadow-[4px_4px_0_0_rgba(252,211,77,1)] rounded-lg">
                  10000G 達成おめでとう！
                </div>
                <input
                  type="text"
                  placeholder="名前 (4文字以内, 大文字英字)"
                  className="w-full p-3 bg-gray-700/70 text-white border-2 border-gray-600 focus:border-yellow-400 outline-none uppercase text-center rounded-lg"
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
          <div className="border-4 border-white p-6 bg-blue-900 min-h-[120px] flex items-center mb-8 relative shadow-[4px_4px_0_0_rgba(255,255,255,1)] rounded-lg">
            <p className="text-xl leading-relaxed font-bold">➤ {message}</p>
            <div className="absolute bottom-2 right-4 animate-bounce text-xs opacity-50">▼</div>
          </div>
        </div>

        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="border-4 border-white p-4 bg-blue-900/70 shadow-[4px_4px_0_0_rgba(255,255,255,1)] rounded-lg">
            <h3 className="text-yellow-400 text-lg mb-4 border-b-2 border-white pb-2 font-bold text-center italic tracking-widest">
              でたカード記録
            </h3>
            <div className="text-center text-xs opacity-70 font-bold mb-4">
              山札残り: {deck.length} / 54枚
            </div>
            <div className="space-y-1">
              {CARD_TYPES.map(type => {
                const count = usedCards.filter(c => c === type).length;
                const max = type === 'JK' ? 2 : 4;
                const hasAppeared = count > 0;
                return (
                  <div key={type} className={`flex justify-between items-center px-2 py-1 border-b border-white/10 transition-all duration-300 ${hasAppeared ? 'text-white' : 'opacity-20 text-gray-500'}`}>
                    <span className="font-bold w-8">{type}</span>
                    <div className="flex gap-1 flex-1 justify-center">
                      {[...Array(max)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 border transition-colors ${i < count ? 'bg-yellow-400 border-yellow-400 shadow-[0_0_5px_rgba(255,255,0,0.5)]' : 'border-white/30'}`} 
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
              <div className="mt-6 p-2 border-2 border-red-500 text-red-500 text-center animate-pulse font-bold text-xs rounded-lg">
                破産しました...
              </div>
            )}
          </div>

          <div className="border-4 border-white p-4 bg-blue-900/70 shadow-[4px_4px_0_0_rgba(255,255,255,1)] self-stretch rounded-lg">
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
                      {new Date(achiever.achievedAt).toLocaleString('ja-JP', {
                          year: 'numeric', month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: false
                      })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getCardImagePath(value: string): string {
  switch (value) {
    case 'A': return '/images/card/card_club_01.png';
    case '2': return '/images/card/card_club_02.png';
    case '3': return '/images/card/card_club_03.png';
    case '4': return '/images/card/card_club_04.png';
    case '5': return '/images/card/card_club_05.png';
    case '6': return '/images/card/card_club_06.png';
    case '7': return '/images/card/card_club_07.png';
    case '8': return '/images/card/card_club_08.png';
    case '9': return '/images/card/card_club_09.png';
    case '10': return '/images/card/card_club_10.png';
    case 'J': return '/images/card/card_club_11.png';
    case 'Q': return '/images/card/card_club_12.png';
    case 'K': return '/images/card/card_club_13.png';
    case 'JK': return '/images/card/card_club_joker.png'; // Assuming this exists for Joker
    default: return '/images/card/card_back.png'; // Fallback for '?' or any unexpected value
  }
}

function CardDisplay({ value, label }: { value: string, label: string }) {
  const isBack = value === '?'; // Simplified from value === '?' || value === ''
  const imageUrl = getCardImagePath(value);
  const altText = isBack ? 'Card back' : `${value} card`;

  return (
    <div className="text-center">
      <div className="text-xs mb-2 text-gray-400 font-bold uppercase tracking-widest">{label}</div>
      <div className={`relative w-24 h-36 md:w-32 md:h-48 rounded-xl border-4 shadow-2xl transition-all duration-300 transform
        ${isBack ? 'border-white' : 'border-gray-400'}
        ${value === 'JK' ? 'ring-4 ring-red-600' : ''}
      `}>
        <Image
          src={imageUrl}
          alt={altText}
          layout="fill" // Use fill to make image fill the parent div
          objectFit="contain" // Or 'cover' depending on desired crop
          className="rounded-lg" // Apply rounded corners to the image
        />
      </div>
    </div>
  );
}

function MenuButton({ children, onClick, highlight = false }: { children: React.ReactNode, onClick: () => void, highlight?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`w-full text-left px-6 py-4 border-2 border-transparent hover:border-white group flex items-center transition-all duration-75 bg-blue-900/40 hover:bg-blue-800 rounded-lg ${highlight ? 'text-yellow-400' : 'text-white'}`}
    >
      <span className="opacity-0 group-hover:opacity-100 mr-3 font-bold text-2xl transition-transform transform translate-x-[-4px] group-hover:translate-x-0">➤</span>
      <span className="text-xl font-bold tracking-tight">{children}</span>
    </button>
  );
}