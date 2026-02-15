"use client";
import { useState, useEffect, useCallback } from 'react';
import { addGold, decreaseGold } from '@/lib/actions';

const CARD_TYPES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', 'JK'];

export function usePoker() {
  const [gold, setGold] = useState(0);
  const [startGold, setStartGold] = useState(0);
  const [currentBetAmount, setCurrentBetAmount] = useState(0);
  const [deck, setDeck] = useState<string[]>([]);
  const [usedCards, setUsedCards] = useState<string[]>([]);
  const [currentCard, setCurrentCard] = useState('');
  const [nextCard, setNextCard] = useState('');
  const [bet, setBet] = useState(0);
  const [message, setMessage] = useState('');
  const [gameState, setGameState] = useState<'UNINITIALIZED' | 'IDLE' | 'PLAYING' | 'RESULT' | 'LOSE' | 'CLEAR'>('UNINITIALIZED');

  const createFullDeck = useCallback(() => {
    const newDeck: string[] = [];
    CARD_TYPES.slice(0, 13).forEach(type => {
      for (let i = 0; i < 4; i++) newDeck.push(type);
    });
    newDeck.push('JK');
    newDeck.push('JK');
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const initializeGame = useCallback((sg: number, ib: number) => {
    setStartGold(sg);
    setGold(sg);
    setCurrentBetAmount(ib);
    setDeck(createFullDeck());
    setUsedCards([]);
    setBet(0);
    setGameState('IDLE');
    setMessage("ゲームを始める");
  }, [createFullDeck]);

  const pullCard = (currentDeck: string[]) => {
    let tempDeck = [...currentDeck];
    if (tempDeck.length === 0) {
      tempDeck = createFullDeck();
      setUsedCards([]); 
      setMessage("山札が なくなったので あたらしく つくった！");
    }
    const card = tempDeck.pop()!;
    setDeck(tempDeck);
    return card;
  };

  const startNewHand = async () => {
    if (gold < currentBetAmount) return;
    setGold(prev => prev - currentBetAmount);
    await decreaseGold(currentBetAmount);
    const card = pullCard(deck);
    setCurrentCard(card);
    setUsedCards(prev => [...prev, card]);
    setBet(currentBetAmount);
    setGameState('PLAYING');
    setMessage(`ディーラーは ${card} をだした！ 上か？下か？`);
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

  const collect = async () => {
    const newTotal = gold + bet;
    setGold(newTotal);
    await addGold(bet);
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
    setGold(startGold);
    setDeck(createFullDeck());
    setUsedCards([]);
    setBet(0);
    setGameState('IDLE');
    setMessage(`${currentBetAmount}G はらって ゲームを はじめよう！`);
  };

  return {
    gold, deck, usedCards, currentCard, nextCard, bet, message, gameState,
    startNewHand, handleGuess, collect, continueGame, fullReset, CARD_TYPES,
    initializeGame, currentBetAmount
  };
}