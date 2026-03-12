"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Bookmark, 
  Clock, 
  CheckCircle,
  ChevronRight,
  Library,
  HelpCircle,
  Loader2
} from 'lucide-react';
import { getMyBookshelf } from './actions';
import { GoldStatus } from '@/components/GoldStatus';
import { getUserGoldData } from '@/lib/actions';
import { WelcomeGuide } from '@/components/Navigation/WelcomeGuide';
import { GUIDE_CONTENTS } from '@/constants/guideContents';
import { useSessionFirstTime } from '@/hooks/useSessionFirstTime';

export const dynamic = 'force-dynamic';

export default function BookshelfPortal() {
...
  const [loading, setLoading] = useState(true);
  const [gold, setGold] = useState(0);
  const [filter, setFilter] = useState<string>('ALL');
  const { isOpen, markAsSeen, showAgain } = useSessionFirstTime('has_seen_bookshelf_portal');

  useEffect(() => {
    async function load() {
      const [bookData, goldData] = await Promise.all([
        getMyBookshelf(),
        getUserGoldData()
      ]);
      setBooks(bookData);
      setGold(goldData.gold);
      setLoading(false);
    }
    load();
  }, []);

  const filteredBooks = filter === 'ALL' ? books : books.filter(b => b.status === filter);

  const stats = {
    total: books.length,
    unread: books.filter(b => b.status === 'UNREAD').length,
    reading: books.filter(b => b.status === 'READING').length,
    completed: books.filter(b => b.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30 overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <Image src="/images/toppage_wheel_labo.png" alt="" fill className="object-cover" priority />
      </div>

      <WelcomeGuide 
        isOpen={isOpen} 
        onClose={markAsSeen} 
        content={GUIDE_CONTENTS.BOOKSHELF_APP} 
      />

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
                <Link href="/" className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Gateway
                </Link>
                <button onClick={showAgain} className="p-2 bg-white/5 text-gray-500 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
            <GoldStatus amount={gold} />
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-5xl font-black tracking-tighter mb-4">My <span className="text-[#0cf]">Bookshelf</span></h1>
              <p className="text-gray-400 text-lg">蔵書データと地域図書館の状況を一元管理します。</p>
            </div>
            
            <Link href="/bookshelf/scan" className="group relative px-8 py-4 bg-[#0cf] text-black font-black rounded-2xl overflow-hidden hover:scale-105 transition-transform flex items-center gap-3">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Plus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">ADD NEW BOOK</span>
            </Link>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-in fade-in slide-in-from-bottom duration-700">
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Total Collection</div>
                <div className="text-3xl font-black">{stats.total} <span className="text-xs text-gray-600 font-normal">BOOKS</span></div>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-amber-500 uppercase tracking-widest mb-1">Unread</div>
                <div className="text-3xl font-black text-amber-500">{stats.unread}</div>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-blue-400 uppercase tracking-widest mb-1">Reading</div>
                <div className="text-3xl font-black text-blue-400">{stats.reading}</div>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-1">Completed</div>
                <div className="text-3xl font-black text-emerald-500">{stats.completed}</div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
            {[
                { id: 'ALL', label: 'すべて', icon: <Search className="w-3 h-3" /> },
                { id: 'UNREAD', label: '未読', icon: <Bookmark className="w-3 h-3" /> },
                { id: 'READING', label: '読書中', icon: <Clock className="w-3 h-3" /> },
                { id: 'COMPLETED', label: '読了', icon: <CheckCircle className="w-3 h-3" /> },
            ].map(f => (
                <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${filter === f.id ? 'bg-[#0cf] text-black border-[#0cf] shadow-[0_0_15px_#0cf]' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-white'}`}
                >
                    {f.icon} {f.label}
                </button>
            ))}
        </div>

        {/* Book Grid */}
        {loading ? (
            <div className="h-64 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#0cf] animate-spin" />
            </div>
        ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredBooks.map((book, idx) => (
                    <Link 
                        key={book.id} 
                        href={`/bookshelf/book/${book.isbn}`}
                        className="group animate-in fade-in slide-in-from-bottom duration-500"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden mb-3 border border-white/5 group-hover:border-[#0cf]/50 transition-all group-hover:scale-[1.02]">
                            {book.thumbnail ? (
                                <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gray-900 flex items-center justify-center text-[10px] text-gray-700">NO COVER</div>
                            )}
                            <div className="absolute top-2 right-2">
                                {book.status === 'COMPLETED' && <div className="p-1 bg-emerald-500 rounded-lg text-black"><CheckCircle className="w-3 h-3" /></div>}
                                {book.status === 'READING' && <div className="p-1 bg-blue-500 rounded-lg text-black"><Clock className="w-3 h-3" /></div>}
                                {book.status === 'UNREAD' && <div className="p-1 bg-amber-500 rounded-lg text-black"><Bookmark className="w-3 h-3" /></div>}
                            </div>
                        </div>
                        <div className="px-1">
                            <h3 className="text-sm font-bold line-clamp-2 leading-snug group-hover:text-[#0cf] transition-colors">{book.title}</h3>
                            <p className="text-[10px] text-gray-500 font-mono mt-1 truncate uppercase">{book.authors}</p>
                        </div>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[32px] text-center">
                <Library className="w-12 h-12 text-gray-800 mb-4" />
                <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">No books found in this category.</p>
            </div>
        )}
      </main>
    </div>
  );
}
