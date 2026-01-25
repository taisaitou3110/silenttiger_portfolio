"use client";
import { useState, useEffect } from 'react';

// カードの強さ順（JOKERを最強に設定）
const CARD_TYPES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'JK'];

export function usePoker(initialGold: number = 5000, initialBet: number = 100) {
  const [gold, setGold] = useState(initialGold);
  const [startGold, setStartGold] = useState(initialGold); // To keep track of the chosen starting gold for reset
  const [currentBetAmount, setCurrentBetAmount] = useState(initialBet); // To keep track of the chosen initial bet
  const [deck, setDeck] = useState<string[]>([]);
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const [currentCard, setCurrentCard] = useState('');
  const [nextCard, setNextCard] = useState('');
  const [bet, setBet] = useState(0);
  const [message, setMessage] = useState('100G はらって ゲームを はじめよう！');
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'RESULT' | 'LOSE' | 'CLEAR'>('IDLE');

  // 54枚の山札を生成する関数
  const createFullDeck = () => {
    const newDeck: string[] = [];
    // 2〜Aまでを4枚ずつ追加
    CARD_TYPES.slice(0, 13).forEach(type => {
      for (let i = 0; i < 4; i++) newDeck.push(type);
    });
    // ジョーカーを2枚追加
    newDeck.push('JK');
    newDeck.push('JK');
    return newDeck.sort(() => Math.random() - 0.5);
  };

  useEffect(() => {
    if (deck.length === 0) {
      setDeck(createFullDeck());
    }
  }, []);

  const pullCard = (currentDeck: string[]) => {
    let tempDeck = [...currentDeck];
    if (tempDeck.length === 0) {
      // 山札が切れたらその場で新しく生成
      tempDeck = createFullDeck();
      setUsedCards([]); 
      setMessage("山札が なくなったので あたらしく つくった！");
    }
    const card = tempDeck.pop()!;
    setDeck(tempDeck);
    return card;
  };

  const startNewHand = () => {
    if (gold < currentBetAmount) return; // Use currentBetAmount
    setGold(prev => prev - currentBetAmount); // Deduct currentBetAmount
    const card = pullCard(deck);
    setCurrentCard(card);
    setUsedCards(prev => [...prev, card]);
    setBet(currentBetAmount); // Set bet to currentBetAmount
    setGameState('PLAYING');
    setMessage(`スライムは ${card} をだした！ 上か？下か？`);
  };

  const handleGuess = (guess: 'HIGH' | 'LOW') => {
    const newCard = pullCard(deck);
    setNextCard(newCard);
    setUsedCards(prev => [...prev, newCard]);
    
    const currentIndex = CARD_TYPES.indexOf(currentCard);
    const nextIndex = CARD_TYPES.indexOf(newCard);
    
    if (currentIndex === nextIndex) {
      setMessage(`引き分けだ！ ${currentCard} のまま やり直し！`);
    } else if ((guess === 'HIGH' && nextIndex > currentIndex) || (guess === 'LOW' && nextIndex < currentIndex)) {
      setBet(prev => prev * 2);
      setMessage(`当たり！ 配当が ${bet * 2}G になった！`);
      setGameState('RESULT');
    } else {
      setBet(0);
      setGameState('LOSE');
      setMessage(`残念！ 全てを失った… (${newCard} だった！)`);
    }
  };

  const collect = () => {
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

  const continueGame = () => {
    setCurrentCard(nextCard);
    setNextCard('');
    setGameState('PLAYING');
    setMessage(`${nextCard} より 上か？下か？`);
  };

  const fullReset = () => {
    setGold(startGold); // Reset to startGold
    setDeck(createFullDeck());
    setUsedCards([]);
    setBet(0);
    setGameState('IDLE');
    setMessage(`${currentBetAmount}G はらって ゲームを はじめよう！`); // Update message
  };

  return {
    gold, deck, usedCards, currentCard, nextCard, bet, message, gameState,
    startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES,
    startGold, setStartGold, currentBetAmount, setCurrentBetAmount
  };
}