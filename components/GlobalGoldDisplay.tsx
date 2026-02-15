"use client";

import React, { useEffect, useState } from 'react';
import { GoldStatus } from '@/components/GoldStatus';
import { getUserGoldData } from '@/lib/actions';

export function GlobalGoldDisplay() {
  const [gold, setGold] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGold = async () => {
      const { gold: fetchedGold } = await getUserGoldData();
      setGold(fetchedGold);
      setLoading(false);
    };
    fetchGold();

    // Polling or subscription for real-time updates could be added here if needed
    // For now, it fetches once on mount.
  }, []);

  if (loading) {
    return null; // Or a loading spinner
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <GoldStatus amount={gold} />
    </div>
  );
}