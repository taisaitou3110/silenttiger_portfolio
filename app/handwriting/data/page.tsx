"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Users, MessageSquare, ShoppingBag, StickyNote, Search } from 'lucide-react';
import { getHandwritingData } from '../actions';

export default function DataViewerPage() {
  const [activeTab, setActiveTab] = useState('customers');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function load() {
      const res = await getHandwritingData();
      setData(res);
      setLoading(false);
    }
    load();
  }, []);

  const tabs = [
    { id: 'customers', label: 'Customers', icon: <Users className="w-4 h-4" /> },
    { id: 'requirements', label: 'Requirements', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
    { id: 'notes', label: 'General Notes', icon: <StickyNote className="w-4 h-4" /> },
  ];

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-pulse text-[#0cf] font-mono tracking-[0.5em]">LOADING DATABASE...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-12">
          <Link href="/handwriting" className="flex items-center text-gray-500 hover:text-[#0cf] transition-colors mb-6 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Hub</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tighter mb-2">Database <span className="text-[#0cf]">Viewer</span></h1>
              <p className="text-gray-500 text-sm font-medium">これまでにスキャン・保存された全データを管理します。</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-900/40 border border-white/10 rounded-full pl-12 pr-6 py-3 text-sm focus:border-[#0cf] outline-none transition-all w-full md:w-64"
              />
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-white/5 pb-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all
                ${activeTab === tab.id ? 'bg-[#0cf] text-black shadow-lg shadow-[#0cf]/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-gray-900/20 border border-white/5 rounded-3xl overflow-hidden min-h-[400px]">
          {activeTab === 'customers' && (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/5 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-400">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Requirements</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.customers.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-bold group-hover:text-[#0cf]">{c.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{c.tel || '-'}</td>
                    <td className="px-6 py-4 text-sm">{c.requirements.length} cases</td>
                    <td className="px-6 py-4 text-sm">{c.orders.length} orders</td>
                    <td className="px-6 py-4 text-[10px] font-mono text-gray-500 uppercase">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'requirements' && (
            <div className="divide-y divide-white/5">
              {data.requirements.map((r: any) => (
                <div key={r.id} className="p-6 hover:bg-white/5 transition-colors">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-[#0cf]">{r.customer.name}</span>
                    <span className="text-[10px] font-mono text-gray-500">{new Date(r.receivedAt).toLocaleString()}</span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {data.orders.map((o: any) => (
                <div key={o.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono text-[#0cf] uppercase mb-2">Order #{o.id}</div>
                    <h3 className="font-bold mb-1">{o.itemName}</h3>
                    <p className="text-gray-400 text-xs mb-4">from {o.customer.name}</p>
                  </div>
                  <div className="flex items-end justify-between">
                    <div className="text-gray-500 text-xs">Qty: {o.quantity}</div>
                    <div className="text-lg font-black">{o.price.toLocaleString()}円</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
              {data.notes.map((n: any) => (
                <div key={n.id} className="p-6 bg-gray-900/40 rounded-2xl border border-white/5 border-l-4 border-l-[#0cf]">
                   <div className="text-[10px] font-mono text-gray-500 uppercase mb-4">{new Date(n.createdAt).toLocaleString()}</div>
                   <p className="text-sm text-gray-300 whitespace-pre-wrap serif">{n.rawText}</p>
                </div>
              ))}
            </div>
          )}

          {(!data[activeTab] || data[activeTab].length === 0) && (
            <div className="flex flex-col items-center justify-center h-[400px] text-gray-600">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                {tabs.find(t => t.id === activeTab)?.icon}
              </div>
              <p className="text-sm font-bold">No data found in {activeTab}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
