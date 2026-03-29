import { Piece } from './piece.model';

export interface TetrisState {
  board: number[][];
  currentPiece: number[][];
  currentColor: number;
  posX: number;
  posY: number;
  score: number;
  gameOver: boolean;
}
