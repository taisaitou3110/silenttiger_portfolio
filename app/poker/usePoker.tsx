"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
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

  // --- Sound Effects ---
  const cardTurnSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sound/cardturn.mp3') : null);
  const correctSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sound/ok_maou_se_system23.mp3') : null);
  const wrongSound = useRef(typeof Audio !== 'undefined' ? new Audio('/sound/maou_se_system26.mp3') : null);

  const playSound = useCallback((audioRef: React.MutableRefObject<HTMLAudioElement | null>) => {
    if (audioRef.current) {
      console.log("Attempting to play sound from:", audioRef.current.src); // Diagnostic log
      audioRef.current.currentTime = 0; // Rewind to start
      audioRef.current.play().catch(e => {
        console.error("Error playing sound from:", audioRef.current.src, e); // More detailed error log
      });
    }
  }, []);

  const createFullDeck = useCallback(() => {
    const newDeck: string[] = [];
    CARD_TYPES.slice(0, 13).forEach(type => {
      for (let i = 0; i < 4; i++) newDeck.push(type);
    });
    newDeck.push('JK');
    newDeck.push('JK');
    return newDeck.sort(() => Math.random() - 0.5);
  }, []);

  const initializeGame = useCallback(async (sg: number, ib: number) => {
    setStartGold(sg);
    // 初回の賭け金を即座に引く
    const initialGold = sg - ib;
    setGold(initialGold);
    await decreaseGold(ib); // DB側のゴールドも減らす

    setCurrentBetAmount(ib);
    const newDeck = createFullDeck();
    const card = newDeck.pop()!; // 1枚目を引く
    
    setDeck(newDeck);
    setUsedCards([card]);
    setCurrentCard(card);
    setBet(ib);
    setGameState('PLAYING');
    setMessage(`ディーラーは ${card} をだした！ 上か？下か？`);
    playSound(cardTurnSound);
  }, [createFullDeck, playSound, cardTurnSound]);

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

  const startNewHand = useCallback(async () => {
    if (gold < currentBetAmount) return;
    setGold(prev => prev - currentBetAmount);
    await decreaseGold(currentBetAmount);
    const card = pullCard(deck);
    setCurrentCard(card);
    setUsedCards(prev => [...prev, card]);
    setBet(currentBetAmount);
    setGameState('PLAYING');
    setMessage(`ディーラーは ${card} をだした！ 上か？下か？`);
    playSound(cardTurnSound); // Play sound here
  }, [gold, currentBetAmount, decreaseGold, deck, pullCard, setCurrentCard, setUsedCards, setBet, setGameState, setMessage, cardTurnSound, playSound]);

  const handleGuess = useCallback((guess: 'HIGH' | 'LOW') => {
    const newCard = pullCard(deck);
    setNextCard(newCard);
    setUsedCards(prev => [...prev, newCard]);
    playSound(cardTurnSound); // Play sound here
    
    const currentIndex = CARD_TYPES.indexOf(currentCard);
    const nextIndex = CARD_TYPES.indexOf(newCard);
    
    if (currentIndex === nextIndex) {
      setMessage(`引き分けだ！ ${currentCard} のまま やり直し！`);
    } else if ((guess === 'HIGH' && nextIndex > currentIndex) || (guess === 'LOW' && nextIndex < currentIndex)) {
      setBet(prev => prev * 2);
      setMessage(`当たり！ 配当が ${bet * 2}G になった！`);
      setGameState('RESULT');
      playSound(correctSound); // Play sound here
    } else {
      setBet(0);
      setGameState('LOSE');
      setMessage(`残念！ 全てを失った…`);
      playSound(wrongSound); // Play sound here
    }
  }, [deck, pullCard, setNextCard, setUsedCards, playSound, cardTurnSound, currentCard, bet, setBet, setGameState, setMessage, correctSound, wrongSound]);

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

  const continueGame = useCallback(() => {
    setCurrentCard(nextCard);
    setNextCard('');
    setGameState('PLAYING');
    setMessage(`${nextCard} より 上か？下か？`);
    playSound(cardTurnSound); // Play sound here
  }, [nextCard, setCurrentCard, setNextCard, setGameState, setMessage, playSound, cardTurnSound]);

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