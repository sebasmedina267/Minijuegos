import { Tile } from './tile.model';

export interface GameState {
  size: number;
  grid: Tile[][];
  score: number;
  gameOver: boolean;
  started: boolean;
  paused: boolean;
}
