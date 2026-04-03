/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { observer } from 'mobx-react-lite';
import { motion } from 'motion/react';
import { gameManager, CHARACTERS } from '../core/GameManager';
import { cn } from '../lib/utils';
import { Trophy, Coins, Gem, Settings, Users, MessageSquare, ShoppingBag, BookOpen, UserCircle } from 'lucide-react';

export const Lobby = observer(() => {
  const char = gameManager.selectedCharacter;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 flex flex-col overflow-hidden select-none">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 z-50">
        <div className="flex gap-4">
          {/* Profile */}
          <div className="flex items-center gap-2 bg-black/40 p-1 pr-4 rounded-full border border-white/10">
            <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden">
              <UserCircle className="text-white w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] text-white/60 font-bold uppercase">LAZ ALİ</div>
              <div className="flex items-center gap-1">
                <Trophy className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span className="text-white font-black text-sm">{gameManager.trophies}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-bold">{gameManager.coins}</span>
            <div className="bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">+</div>
          </div>
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
            <Gem className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold">{gameManager.gems}</span>
            <div className="bg-green-500 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">+</div>
          </div>
          <button className="bg-black/40 p-2 rounded-lg border border-white/10">
            <Settings className="text-white w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Character Display */}
        <motion.div 
          key={char.id}
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute -inset-20 bg-white/5 blur-3xl rounded-full group-hover:bg-white/10 transition-all" />
          <div className={cn(
            "w-48 h-64 rounded-3xl shadow-2xl border-4 border-white/20 flex flex-col items-center justify-end p-6 relative overflow-hidden",
            char.color
          )}>
            <div className="absolute top-4 left-4 bg-black/20 px-2 py-1 rounded-md text-[10px] text-white font-bold uppercase">
              Power 11
            </div>
            <div className="text-white text-center">
              <div className="text-2xl font-black uppercase tracking-tighter italic">{char.name}</div>
              <div className="text-[10px] opacity-70 font-bold uppercase">{char.ability}</div>
            </div>
          </div>
          
          {/* Rank & Trophies */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
             <div className="bg-purple-600 px-3 py-1 rounded-md border-2 border-white/20 text-white font-black text-sm italic">RANK 21</div>
             <div className="flex items-center gap-1 bg-orange-500 px-4 py-0.5 rounded-full border-2 border-white/20 -mt-1">
                <Trophy className="w-3 h-3 text-white fill-white" />
                <span className="text-white font-bold text-xs">576</span>
             </div>
          </div>
        </motion.div>

        {/* Side Buttons */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <SideButton icon={<ShoppingBag />} label="Shop" color="bg-orange-500" />
          <div className="flex flex-col gap-2">
            {gameManager.unlockedCharacterIds.map(id => (
              <button 
                key={id}
                onClick={() => gameManager.selectCharacter(id)}
                className={cn(
                  "w-12 h-12 rounded-xl border-2 transition-all",
                  gameManager.selectedCharacterId === id ? "border-white scale-110 shadow-lg" : "border-white/20 opacity-50"
                )}
              >
                <div className={cn("w-full h-full rounded-lg", CHARACTERS.find(c => c.id === id)?.color)} />
              </button>
            ))}
          </div>
          <SideButton icon={<Users />} label="Brawlers" color="bg-blue-500" badge="3" />
        </div>

        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4">
          <SideButton icon={<Users />} label="Friends" color="bg-yellow-500" />
          <SideButton icon={<MessageSquare />} label="Club" color="bg-red-500" />
          <SideButton icon={<MessageSquare />} label="Chat" color="bg-indigo-500" />
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="p-6 flex items-end justify-between z-50">
        <div className="flex flex-col gap-2">
           <div className="bg-yellow-400 px-4 py-2 rounded-xl border-4 border-yellow-600 shadow-lg flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform">
              <div className="w-8 h-8 bg-black/20 rounded-full flex items-center justify-center">
                <Trophy className="text-white w-5 h-5" />
              </div>
              <div className="text-black font-black italic uppercase text-sm">Brawl Pass</div>
           </div>
        </div>

        <div className="flex flex-col items-center gap-4">
           <div className="bg-black/40 backdrop-blur-md px-12 py-3 rounded-2xl border-4 border-white/10 flex flex-col items-center cursor-pointer hover:bg-black/60 transition-all">
              <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Solo Showdown</div>
              <div className="text-white font-black text-xl uppercase italic">Super Stadium</div>
           </div>
           
           <button 
             onClick={() => gameManager.startMatch()}
             className="bg-yellow-400 px-24 py-6 rounded-3xl border-b-8 border-yellow-600 shadow-2xl hover:scale-105 active:scale-95 transition-all group"
           >
              <span className="text-black font-black text-4xl uppercase italic tracking-tighter group-hover:tracking-normal transition-all">PLAY</span>
           </button>
        </div>

        <div className="w-48" /> {/* Spacer */}
      </div>
    </div>
  );
});

const SideButton = ({ icon, label, color, badge }: { icon: React.ReactNode, label: string, color: string, badge?: string }) => (
  <button className={cn("w-16 h-16 rounded-2xl flex flex-col items-center justify-center relative border-b-4 border-black/20 hover:scale-110 transition-all", color)}>
    <div className="text-white">{icon}</div>
    <div className="text-[8px] text-white font-black uppercase mt-1">{label}</div>
    {badge && (
      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
        {badge}
      </div>
    )}
  </button>
);
