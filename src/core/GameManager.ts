/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { makeAutoObservable } from "mobx";

export interface Character {
  id: string;
  name: string;
  color: string;
  maxHealth: number;
  damage: number;
  range: number;
  reloadTime: number;
  speed: number;
  description: string;
  ability: string;
}

export const CHARACTERS: Character[] = [
  { id: 'shelly', name: 'Shelly', color: 'bg-purple-500', maxHealth: 3600, damage: 800, range: 7, reloadTime: 1.0, speed: 5, description: 'Dengeli bir savaşçı.', ability: 'Süper Fişek' },
  { id: 'colt', name: 'Colt', color: 'bg-blue-500', maxHealth: 2800, damage: 1200, range: 9, reloadTime: 1.2, speed: 5.5, description: 'Uzun menzilli keskin nişancı.', ability: 'Mermi Fırtınası' },
  { id: 'el_primo', name: 'El Primo', color: 'bg-red-500', maxHealth: 6000, damage: 1500, range: 3, reloadTime: 0.8, speed: 4.5, description: 'Yüksek canlı yakın dövüşçü.', ability: 'Uçan Dirsek Darbesi' },
];

/**
 * GameManager (Singleton Pattern)
 */
class GameManager {
  // Global State
  view: "LOBBY" | "GAME" | "RESULTS" = "LOBBY";
  
  // Player Profile
  trophies = 13568;
  coins = 1920;
  powerPoints = 151;
  gems = 45;
  selectedCharacterId = 'shelly';
  unlockedCharacterIds = ['shelly', 'colt', 'el_primo'];
  
  // Game Session State
  playerStats = { ...CHARACTERS[0] };
  currentHealth = 3600;
  ammoCount = 3;
  powerCubes = 0;
  rank = 0;
  trophyChange = 0;

  constructor() {
    makeAutoObservable(this);
  }

  get selectedCharacter(): Character {
    return CHARACTERS.find(c => c.id === this.selectedCharacterId) || CHARACTERS[0];
  }

  startMatch() {
    this.startGame();
  }

  selectCharacter(id: string) {
    const char = CHARACTERS.find(c => c.id === id);
    if (char) {
      this.selectedCharacterId = id;
      this.playerStats = { ...char };
      this.currentHealth = char.maxHealth;
    }
  }

  startGame() {
    this.view = "GAME";
    this.currentHealth = this.playerStats.maxHealth;
    this.ammoCount = 3;
    this.powerCubes = 0;
    this.rank = 0;
  }

  endGame(rank: number) {
    this.rank = rank;
    // Trophy calculation: 1st: +10, 2nd: +8, 3rd: +6, 4th: +4, 5th: +2, 6th: 0, 7th: -2, 8th: -4, 9th: -6, 10th: -8
    const changes = [10, 8, 6, 4, 2, 0, -2, -4, -6, -8];
    this.trophyChange = changes[rank - 1] || -10;
    this.trophies += this.trophyChange;
    this.view = "RESULTS";
  }

  goToLobby() {
    this.view = "LOBBY";
  }

  takeDamage(amount: number) {
    this.currentHealth = Math.max(0, this.currentHealth - amount);
  }

  heal(amount: number) {
    this.currentHealth = Math.min(this.playerStats.maxHealth, this.currentHealth + amount);
  }

  useAmmo() {
    if (this.ammoCount > 0) {
      this.ammoCount--;
      return true;
    }
    return false;
  }

  reload() {
    if (this.ammoCount < 3) {
      this.ammoCount++;
    }
  }

  addPowerCube() {
    this.powerCubes++;
    // Her küp %10 can ve hasar artırır
    this.playerStats.maxHealth += Math.floor(this.playerStats.maxHealth * 0.1);
    this.playerStats.damage += Math.floor(this.playerStats.damage * 0.1);
    this.currentHealth += Math.floor(this.playerStats.maxHealth * 0.1);
  }
}

export const gameManager = new GameManager();
