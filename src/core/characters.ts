/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Character {
  id: string;
  name: string;
  description: string;
  color: string;
  maxHealth: number;
  damage: number;
  range: number;
  reloadTime: number;
  moveSpeed: number;
  ability: string;
}

export const CHARACTERS: Character[] = [
  {
    id: 'shelly',
    name: 'Shelly',
    description: 'Shotgun specialist with balanced stats.',
    color: 'bg-purple-500',
    maxHealth: 3600,
    damage: 800,
    range: 7,
    reloadTime: 1.0,
    moveSpeed: 5,
    ability: 'Super Shell'
  },
  {
    id: 'colt',
    name: 'Colt',
    description: 'Long range gunslinger with high damage but low health.',
    color: 'bg-red-500',
    maxHealth: 2800,
    damage: 1200,
    range: 10,
    reloadTime: 1.2,
    moveSpeed: 5.5,
    ability: 'Bullet Storm'
  },
  {
    id: 'el_primo',
    name: 'El Primo',
    description: 'Heavyweight wrestler with high health but short range.',
    color: 'bg-blue-600',
    maxHealth: 6000,
    damage: 1000,
    range: 3,
    reloadTime: 0.8,
    moveSpeed: 6,
    ability: 'Flying Elbow Drop'
  }
];
