"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronLeft, 
  Library, 
  BookOpen, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  Bookmark,
  ShoppingCart,
  Star,
  Zap,
  Loader2,
  Info,
  Save,
  Database
} from 'lucide-react';
import { getBookDetails, BookDetail } from './actions';
import { saveBook } from '../../actions';
import { LibraryStatus } from '@/app/bookshelf/utils/calil';
import MessageBox from '@/components/MessageBox';
import LoadingButton from '@/components/LoadingButton';

export default function BookDetailPage({ params }: { params: { isbn: string } }) {
  const unwrappedParams = React.use(params as any) as { isbn: string };
  const isbn = unwrappedParams.isbn;
  
  const [loading, setLoading] = useState(true);
  const [book, setBook] = useState<BookDetail | null>(null);
  const [libraryStatuses, setLibraryStatuses] = useState<LibraryStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // UI状態
  const [status, setStatus] = useState<"READING" | "COMPLETED" | "UNREAD">("UNREAD");
  const [isSavedInDB, setIsSavedInDB] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const result = await getBookDetails(isbn);
      if (result.error) {
        setError(result.error);
      } else {
        setBook(result.book);
        setLibraryStatuses(result.libraryStatuses);
        // 初期状態を反映
        if (result.book.isSaved) {
            setIsSavedInDB(true);
            setStatus(result.book.savedStatus as any);
        }
      }
      setLoading(false);
    }
    load();
  }, [isbn]);

  const handleSaveAction = async () => {
    if (!book) return;
    setIsSaving(true);
    const res = await saveBook({
      isbn: book.isbn,
      title: book.title,
      authors: book.author,
      thumbnail: book.imageUrl,
      status: status
    });
    if (res.success) {
      setIsSavedInDB(true);
    }
    setIsSaving(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#0cf] animate-spin" />
    </div>
  );

  if (error || !book) return (
    <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
      <MessageBox status="error" title="Fetch Error" description={error || "Book not found"} />
      <Link href="/bookshelf/scan" className="mt-8 text-[#0cf] font-bold uppercase tracking-widest border border-[#0cf]/30 px-6 py-3 rounded-xl hover:bg-[#0cf]/10 transition-all">
        Back to Scanner
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#0cf]/30 pb-24">
      <div className="fixed inset-0 pointer-events-none opacity-5">
        <Image src="/images/toppage_wheel_labo.png" alt="" fill className="object-cover" />
      </div>

      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <header className="mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div className="flex justify-between items-start mb-8">
            <Link href="/bookshelf" className="text-[#0cf] text-sm font-bold tracking-widest uppercase hover:opacity-80 transition-opacity flex items-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Back to Bookshelf
            </Link>
            
            <Link href="/bookshelf/scan" className="px-4 py-2 bg-[#0cf]/10 border border-[#0cf]/30 text-[#0cf] text-[10px] font-black rounded-lg hover:bg-[#0cf] hover:text-black transition-all flex items-center gap-2 uppercase tracking-widest">
                <Save className="w-3 h-3" /> Add New Book
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-12 items-start">
            <div className="relative group mx-auto md:mx-0">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#0cf] to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative aspect-[2/3] w-48 md:w-full bg-gray-900 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                {book.imageUrl ? (
                  <img src={book.imageUrl} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700 font-mono text-[10px]">NO IMAGE</div>
                )}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-2 leading-tight">{book.title}</h1>
                <p className="text-xl text-[#0cf] font-medium">{book.author}</p>
              </div>

              {/* Status & Save Action */}
              <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] space-y-6">
                <div className="space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">1. Select Status</label>
                    <div className="p-1 bg-black/40 rounded-xl border border-white/5 inline-flex w-full md:w-auto">
                        {[
                        { id: 'UNREAD', label: '未読', icon: <Bookmark className="w-3 h-3" /> },
                        { id: 'READING', label: '読書中', icon: <Clock className="w-3 h-3" /> },
                        { id: 'COMPLETED', label: '読了', icon: <CheckCircle className="w-3 h-3" /> },
                        ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => {
                                setStatus(s.id as any);
                                if (isSavedInDB) handleSaveAction(); // 保存済みなら即時更新
                            }}
                            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${status === s.id ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            {s.icon} {s.label}
                        </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">2. Execute Database Sync</label>
                    <LoadingButton
                        onClick={handleSaveAction}
                        isLoading={isSaving}
                        className={`w-full py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                            isSavedInDB 
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 cursor-default' 
                            : 'bg-[#0cf] text-black hover:scale-[1.02] shadow-[0_0_20px_rgba(0,204,255,0.3)]'
                        }`}
                    >
                        {isSavedInDB ? (
                            <>
                                <CheckCircle className="w-6 h-6" />
                                SYNCED TO MY BOOKSHELF
                            </>
                        ) : (
                            <>
                                <Database className="w-6 h-6" />
                                SAVE TO MY BOOKSHELF
                            </>
                        )}
                    </LoadingButton>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 text-[10px] font-mono uppercase tracking-widest text-gray-500">
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">{book.publisher}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">ISBN: {book.isbn}</span>
                <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">{book.publishedDate}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-12">
          <div className="space-y-12">
            <section className="animate-in fade-in slide-in-from-bottom duration-700 delay-200">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-gray-400">
                <BookOpen className="w-4 h-4 text-[#0cf]" /> Book Overview
              </h2>
              <div className="p-8 bg-white/5 border border-white/10 rounded-[32px] leading-relaxed text-gray-300 text-sm shadow-inner">
                {book.description}
              </div>
            </section>

            <section className="animate-in fade-in slide-in-from-bottom duration-700 delay-300">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 mb-6 text-gray-400">
                <Library className="w-4 h-4 text-[#0cf]" /> Library Stock Check
              </h2>
              <div className="space-y-3">
                {libraryStatuses.map((lib, i) => (
                  <div key={i} className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl group hover:border-[#0cf]/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px] ${
                        lib.status === '貸出可' ? 'bg-emerald-500 shadow-emerald-500' : 
                        lib.status === '貸出中' ? 'bg-amber-500 shadow-amber-500' : 'bg-gray-500 shadow-gray-500'
                      }`} />
                      <span className="font-bold">{lib.systemName}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={`text-xs font-black uppercase tracking-widest ${
                        lib.status === '貸出可' ? 'text-emerald-400' : 
                        lib.status === '貸出中' ? 'text-amber-400' : 'text-gray-500'
                      }`}>{lib.status}</span>
                      {lib.reserveUrl && (
                        <a href={lib.reserveUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0cf]/10 text-[#0cf] rounded-lg hover:bg-[#0cf]/20 transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-8 animate-in fade-in slide-in-from-right duration-700 delay-400">
            <div className="p-8 bg-gray-900/40 border border-white/10 rounded-[32px] space-y-6">
              <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Strategic Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#0cf]/10 hover:border-[#0cf]/50 transition-all group"
                >
                  <div className="flex items-center gap-3 text-[#0cf]">
                    <Library className="w-5 h-5" />
                    <span className="text-sm font-bold text-white">図書館で探す</span>
                  </div>
                  <ChevronLeft className="w-4 h-4 text-gray-600 group-hover:text-white rotate-[270deg]" />
                </button>

                <a 
                  href={`https://bookmeter.com/search?keyword=${book.title}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3 text-emerald-500">
                    <Star className="w-5 h-5" />
                    <span className="text-sm font-bold text-white">書評を読む</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" />
                </a>

                <a 
                  href={`https://www.amazon.co.jp/s?k=${book.isbn}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-amber-500/10 hover:border-amber-500/50 transition-all group"
                >
                  <div className="flex items-center gap-3 text-amber-500">
                    <ShoppingCart className="w-5 h-5" />
                    <span className="text-sm font-bold text-white">Amazonで購入</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white" />
                </a>
              </div>
            </div>

            <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                    <Info className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-widest">System Memo</span>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed font-medium">
                    書籍データは Google Books API および カーリル API を同期して取得しています。
                </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
