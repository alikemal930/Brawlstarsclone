/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
import { motion, AnimatePresence } from 'motion/react';
import { Joystick } from './components/Joystick';
import { Lobby } from './components/Lobby';
import { gameManager, CHARACTERS } from './core/GameManager';
import { cn } from './lib/utils';
import { Trophy, Zap, Box, Skull, ArrowLeft } from 'lucide-react';

interface Entity {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  type: 'enemy' | 'player' | 'box';
  name?: string;
  color?: string;
  aiState?: 'idle' | 'chase' | 'attack';
  lastShot?: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  distanceTravelled: number;
  maxRange: number;
  ownerId: string;
}

interface MapObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'water' | 'bush';
}

const GameView = observer(() => {
  // Player State
  const [playerPos, setPlayerPos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [playerRotation, setPlayerRotation] = useState(0);
  const [moveVector, setMoveVector] = useState({ x: 0, y: 0 });
  const [aimVector, setAimVector] = useState({ x: 0, y: 0 });
  const [isAiming, setIsAiming] = useState(false);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });
  const [shake, setShake] = useState(0);
  const [isInBush, setIsInBush] = useState(false);

  // Entities & World
  const [entities, setEntities] = useState<Entity[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [mapObjects] = useState<MapObject[]>([
    { id: 'w1', x: 400, y: 200, width: 80, height: 80, type: 'wall' },
    { id: 'w2', x: 480, y: 200, width: 80, height: 80, type: 'wall' },
    { id: 'wt1', x: 300, y: 500, width: 120, height: 80, type: 'water' },
    { id: 'b1', x: 100, y: 400, width: 150, height: 100, type: 'bush' },
    { id: 'b2', x: 700, y: 100, width: 150, height: 100, type: 'bush' },
  ]);

  const requestRef = useRef<number>(null);
  const lastTimeRef = useRef<number>(0);
  const reloadTimerRef = useRef<number>(0);

  // Initialize Match (10 players total: 1 player + 9 bots + boxes)
  useEffect(() => {
    const bots: Entity[] = [...Array(9)].map((_, i) => ({
      id: `bot_${i}`,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      health: 3000,
      maxHealth: 3000,
      type: 'enemy',
      name: `Bot ${i + 1}`,
      aiState: 'idle',
      lastShot: 0
    }));

    const boxes: Entity[] = [...Array(5)].map((_, i) => ({
      id: `box_${i}`,
      x: 200 + Math.random() * (window.innerWidth - 400),
      y: 200 + Math.random() * (window.innerHeight - 400),
      health: 2000,
      maxHealth: 2000,
      type: 'box'
    }));

    setEntities([...bots, ...boxes]);
  }, []);

  const checkCollision = (x: number, y: number, radius: number, types: string[]) => {
    return mapObjects.some(obj => {
      if (!types.includes(obj.type)) return false;
      return (
        x + radius > obj.x &&
        x - radius < obj.x + obj.width &&
        y + radius > obj.y &&
        y - radius < obj.y + obj.height
      );
    });
  };

  const update = useCallback((time: number) => {
    if (lastTimeRef.current !== undefined) {
      const deltaTime = (time - lastTimeRef.current) / 1000;
      
      // Ammo Reload
      reloadTimerRef.current += deltaTime;
      if (reloadTimerRef.current >= gameManager.playerStats.reloadTime) {
        gameManager.reload();
        reloadTimerRef.current = 0;
      }

      // Player Movement
      if (moveVector.x !== 0 || moveVector.y !== 0) {
        setPlayerPos(prev => {
          const speed = gameManager.playerStats.speed * 50 * deltaTime;
          const nextX = prev.x + moveVector.x * speed;
          const nextY = prev.y + moveVector.y * speed;
          const collidesX = checkCollision(nextX, prev.y, 20, ['wall', 'water']);
          const collidesY = checkCollision(prev.x, nextY, 20, ['wall', 'water']);
          return {
            x: collidesX ? prev.x : Math.max(50, Math.min(window.innerWidth - 50, nextX)),
            y: collidesY ? prev.y : Math.max(50, Math.min(window.innerHeight - 50, nextY))
          };
        });
        if (!isAiming) setPlayerRotation(Math.atan2(moveVector.y, moveVector.x) * (180 / Math.PI));
      }

      // Bush Logic
      setIsInBush(checkCollision(playerPos.x, playerPos.y, 10, ['bush']));

      // Enemy AI & Movement
      setEntities(currentEntities => {
        const aliveBots = currentEntities.filter(e => e.type === 'enemy' && e.health > 0);
        
        // If only player left, win!
        if (aliveBots.length === 0 && gameManager.view === "GAME") {
           // gameManager.endGame(1);
        }

        return currentEntities.map(e => {
          if (e.type !== 'enemy' || e.health <= 0) return e;

          // Simple AI: Chase player if close
          const dx = playerPos.x - e.x;
          const dy = playerPos.y - e.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let nx = e.x;
          let ny = e.y;

          if (dist < 400 && dist > 100) {
            const speed = 150 * deltaTime;
            nx += (dx / dist) * speed;
            ny += (dy / dist) * speed;
            
            // Wall collision for AI
            if (checkCollision(nx, ny, 20, ['wall', 'water'])) {
              nx = e.x;
              ny = e.y;
            }
          }

          // Shooting AI
          if (dist < 300 && time - (e.lastShot || 0) > 1500) {
             const angle = Math.atan2(dy, dx);
             const speed = 400;
             setProjectiles(prev => [...prev, {
               id: Math.random().toString(),
               x: e.x,
               y: e.y,
               vx: Math.cos(angle) * speed,
               vy: Math.sin(angle) * speed,
               distanceTravelled: 0,
               maxRange: 300,
               ownerId: e.id
             }]);
             return { ...e, x: nx, y: ny, lastShot: time };
          }

          return { ...e, x: nx, y: ny };
        });
      });

      // Projectile Logic
      setProjectiles(prev => prev.map(p => {
        const nx = p.x + p.vx * deltaTime;
        const ny = p.y + p.vy * deltaTime;
        const dist = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * deltaTime;
        
        if (checkCollision(nx, ny, 5, ['wall'])) return null as any;

        // Hit Player
        if (p.ownerId !== 'player') {
          const pdx = playerPos.x - nx;
          const pdy = playerPos.y - ny;
          if (Math.sqrt(pdx * pdx + pdy * pdy) < 30) {
            gameManager.takeDamage(500);
            setShake(3);
            if (gameManager.currentHealth <= 0) {
               const aliveCount = entities.filter(e => e.type === 'enemy' && e.health > 0).length + 1;
               gameManager.endGame(aliveCount);
            }
            return null as any;
          }
        }

        // Hit Entities (Enemies or Boxes)
        let hit = false;
        setEntities(current => current.map(e => {
          if (e.id === p.ownerId || e.health <= 0) return e;
          const edx = e.x - nx;
          const edy = e.y - ny;
          if (Math.sqrt(edx * edx + edy * edy) < 30) {
            hit = true;
            const newHealth = Math.max(0, e.health - gameManager.playerStats.damage);
            if (newHealth === 0 && e.type === 'box') {
               gameManager.addPowerCube();
            }
            return { ...e, health: newHealth };
          }
          return e;
        }));

        if (hit || p.distanceTravelled + dist > p.maxRange) return null as any;
        return { ...p, x: nx, y: ny, distanceTravelled: p.distanceTravelled + dist };
      }).filter(Boolean));

      // Camera
      setCameraOffset(prev => ({
        x: prev.x + (moveVector.x * 40 - prev.x) * 0.1,
        y: prev.y + (moveVector.y * 40 - prev.y) * 0.1
      }));

      if (shake > 0) setShake(prev => Math.max(0, prev - deltaTime * 20));
    }
    lastTimeRef.current = time;
    requestRef.current = requestAnimationFrame(update);
  }, [moveVector, isAiming, shake, playerPos, mapObjects, entities]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  const handleShoot = () => {
    if (gameManager.useAmmo() && (aimVector.x !== 0 || aimVector.y !== 0)) {
      setShake(5);
      const angle = Math.atan2(aimVector.y, aimVector.x);
      const speed = 600;
      setProjectiles(prev => [...prev, {
        id: Math.random().toString(),
        x: playerPos.x,
        y: playerPos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        distanceTravelled: 0,
        maxRange: gameManager.playerStats.range * 40,
        ownerId: 'player'
      }]);
    }
  };

  return (
    <div className="fixed inset-0 bg-emerald-900 overflow-hidden font-sans select-none">
      <div className="absolute inset-0" style={{ transform: `translate(${-cameraOffset.x + (Math.random() - 0.5) * shake}px, ${-cameraOffset.y + (Math.random() - 0.5) * shake}px)` }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {mapObjects.map(obj => (
          <div key={obj.id} className={cn("absolute rounded-lg shadow-inner", obj.type === 'wall' && "bg-amber-800 border-4 border-amber-900 z-30", obj.type === 'water' && "bg-blue-500/80 animate-pulse z-0", obj.type === 'bush' && "bg-green-800/90 border-2 border-green-900 z-40")} style={{ left: obj.x, top: obj.y, width: obj.width, height: obj.height, opacity: obj.type === 'bush' && isInBush ? 0.4 : 1 }} />
        ))}

        {isAiming && (
          <div className="absolute pointer-events-none origin-left z-10" style={{ left: playerPos.x, top: playerPos.y, width: gameManager.playerStats.range * 40, height: 20, transform: `translateY(-50%) rotate(${Math.atan2(aimVector.y, aimVector.x)}rad)`, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.3) 0, rgba(255,255,255,0.3) 10px, transparent 10px, transparent 20px)', borderRadius: '10px' }} />
        )}

        {projectiles.map(p => (
          <div key={p.id} className={cn("absolute w-4 h-4 rounded-full shadow-lg z-20", p.ownerId === 'player' ? "bg-yellow-400" : "bg-red-400")} style={{ left: p.x - 8, top: p.y - 8 }} />
        ))}

        {entities.map(e => e.health > 0 && (
          <div key={e.id} className="absolute w-12 h-12 z-20" style={{ left: e.x - 24, top: e.y - 24 }}>
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/40 rounded-full overflow-hidden">
              <div className={cn("h-full transition-all duration-200", e.type === 'enemy' ? "bg-red-500" : "bg-blue-400")} style={{ width: `${(e.health / e.maxHealth) * 100}%` }} />
            </div>
            {e.type === 'enemy' ? (
              <div className="w-full h-full bg-red-600 rounded-xl border-4 border-red-700 shadow-xl flex items-center justify-center text-[8px] font-bold text-white uppercase">{e.name}</div>
            ) : (
              <div className="w-full h-full bg-amber-600 rounded-lg border-4 border-amber-700 shadow-xl flex items-center justify-center"><Box className="w-6 h-6 text-amber-900" /></div>
            )}
          </div>
        ))}

        <motion.div className={cn("absolute w-12 h-12 z-20 transition-opacity duration-300", isInBush ? "opacity-60" : "opacity-100")} style={{ left: playerPos.x - 24, top: playerPos.y - 24 }}>
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/40 rounded-full overflow-hidden border border-black/20">
            <div className={cn("h-full transition-colors duration-300", gameManager.currentHealth / gameManager.playerStats.maxHealth < 0.3 ? "bg-red-500 animate-pulse" : "bg-green-400")} style={{ width: `${(gameManager.currentHealth / gameManager.playerStats.maxHealth) * 100}%` }} />
          </div>
          <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-black text-white italic">{gameManager.powerCubes}</span>
          </div>
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-4 h-1.5 bg-black/40 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 transition-all duration-200" style={{ width: i < gameManager.ammoCount ? '100%' : '0%' }} />
              </div>
            ))}
          </div>
          <div className={cn("w-full h-full rounded-xl shadow-2xl flex items-center justify-center border-4 border-white/20", CHARACTERS.find(c => c.id === gameManager.selectedCharacterId)?.color)} style={{ transform: `rotate(${isAiming ? Math.atan2(aimVector.y, aimVector.x) * (180 / Math.PI) : playerRotation}deg)` }}>
            <div className="w-4 h-4 bg-white rounded-full opacity-50" />
            <div className="absolute right-0 w-4 h-2 bg-yellow-400 rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 bottom-0 w-1/2 h-full pointer-events-auto">
          <Joystick label="Move" onMove={setMoveVector} onEnd={() => setMoveVector({ x: 0, y: 0 })} />
        </div>
        <div className="absolute right-0 bottom-0 w-1/2 h-full pointer-events-auto">
          <Joystick label="Aim" color="red" onMove={(v) => { setAimVector(v); setIsAiming(true); }} onEnd={() => { if (isAiming && (Math.abs(aimVector.x) > 0.5 || Math.abs(aimVector.y) > 0.5)) handleShoot(); setIsAiming(false); setAimVector({ x: 0, y: 0 }); }} />
        </div>
        <div className="absolute top-8 left-8 flex items-center gap-4">
           <button onClick={() => gameManager.goToLobby()} className="pointer-events-auto bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-white"><ArrowLeft className="w-6 h-6"/></button>
           <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
              <Skull className="w-4 h-4 text-red-500" />
              <span className="text-white font-black italic">{entities.filter(e => e.type === 'enemy' && e.health > 0).length + 1} ALIVE</span>
           </div>
        </div>
      </div>
    </div>
  );
});

const ResultsView = observer(() => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[100] select-none">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 rounded-[3rem] border-4 border-white/20 shadow-2xl text-center max-w-md w-full mx-4">
        <h2 className="text-6xl font-black text-white italic tracking-tighter uppercase mb-2">RANK #{gameManager.rank}</h2>
        <div className="text-xl font-bold text-white/70 uppercase tracking-widest mb-8">BATTLE ENDED</div>
        
        <div className="bg-black/20 rounded-3xl p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg"><Trophy className="w-6 h-6 text-white" /></div>
            <div className="text-left">
              <div className="text-white font-black text-2xl italic">{gameManager.trophyChange > 0 ? `+${gameManager.trophyChange}` : gameManager.trophyChange}</div>
              <div className="text-white/50 text-xs font-bold uppercase">Trophies</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/50 text-xs font-bold uppercase">Total</div>
            <div className="text-white font-black text-2xl italic">{gameManager.trophies}</div>
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => gameManager.goToLobby()} className="w-full bg-yellow-400 hover:bg-yellow-300 py-6 rounded-3xl shadow-[0_8px_0_0_#ca8a04] border-t-4 border-white/30 text-3xl font-black text-black italic tracking-tighter uppercase transition-all">EXIT</motion.button>
      </motion.div>
    </div>
  );
});

const App = observer(() => {
  return (
    <>
      {gameManager.view === "LOBBY" && <Lobby />}
      {gameManager.view === "GAME" && <GameView />}
      {gameManager.view === "RESULTS" && <ResultsView />}
    </>
  );
});

export default App;
