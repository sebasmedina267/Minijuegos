import { Injectable } from '@angular/core';
import { TetrisState } from '../models/tetris-state.model';
import { Piece } from '../models/piece.model';

@Injectable({ providedIn: 'root' })
export class TetrisService {

  rows = 20;
  cols = 10;

  // All available Tetris pieces with their shapes and colors.
  pieces: Piece[] = [
    { shape: [[1,1,1,1]], color: 1 },
    { shape: [[1,1],[1,1]], color: 2 },
    { shape: [[0,1,0],[1,1,1]], color: 3 },
    { shape: [[1,0,0],[1,1,1]], color: 4 },
    { shape: [[0,0,1],[1,1,1]], color: 5 },
    { shape: [[1,1,0],[0,1,1]], color: 6 },
    { shape: [[0,1,1],[1,1,0]], color: 7 }
  ];

  /**
   * Creates the initial game state with an empty board.
   * No piece is active yet; the component will spawn the first one.
   */
  createInitialState(): TetrisState {
    return {
      board: this.createEmptyBoard(),
      currentPiece: [],
      currentColor: 0,
      posX: 0,
      posY: 0,
      score: 0,
      gameOver: false,
    };
  }

  /**
   * Builds an empty Tetris board filled with zeros.
   */
  createEmptyBoard(): number[][] {
    return Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0)
    );
  }

  /**
   * Selects a random piece and places it at the top of the board.
   * If the new piece collides immediately, the game is over.
   */
  spawnPiece(state: TetrisState): TetrisState {
    const random = this.pieces[Math.floor(Math.random() * this.pieces.length)];

    const next = { ...state };
    next.currentPiece = JSON.parse(JSON.stringify(random.shape));
    next.currentColor = random.color;
    next.posX = Math.floor(this.cols / 2) - 2;
    next.posY = 0;

    if (this.collides(next, 0, 0, next.currentPiece)) {
      next.gameOver = true;
    }

    return next;
  }

  /**
   * Checks whether a piece collides with the board boundaries or other blocks.
   */
  collides(state: TetrisState, offsetX = 0, offsetY = 0, piece = state.currentPiece): boolean {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const newX = state.posX + x + offsetX;
          const newY = state.posY + y + offsetY;

          if (
            newX < 0 ||
            newX >= this.cols ||
            newY >= this.rows ||
            (newY >= 0 && state.board[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Merges the active piece into the board once it can no longer move.
   */
  mergePiece(state: TetrisState): TetrisState {
    const next = { ...state, board: state.board.map(r => [...r]) };

    for (let y = 0; y < state.currentPiece.length; y++) {
      for (let x = 0; x < state.currentPiece[y].length; x++) {
        if (state.currentPiece[y][x]) {
          next.board[state.posY + y][state.posX + x] = state.currentColor;
        }
      }
    }

    return next;
  }

  /**
   * Removes any fully completed lines and shifts the board down.
   * Awards points based on the number of cleared lines.
   */
  clearLines(state: TetrisState): TetrisState {
    const next = { ...state, board: state.board.map(r => [...r]) };
    let cleared = 0;

    for (let y = this.rows - 1; y >= 0; y--) {
      if (next.board[y].every(cell => cell !== 0)) {
        next.board.splice(y, 1);
        next.board.unshift(Array(this.cols).fill(0));
        cleared++;
        y++;
      }
    }

    if (cleared > 0) {
      next.score += cleared * 100;
    }

    return next;
  }

  /**
   * Attempts to rotate the current piece clockwise.
   * Rotation only happens if the new orientation does not collide.
   */
  rotate(state: TetrisState): TetrisState {
    const rotated = state.currentPiece[0].map((_, i) =>
      state.currentPiece.map(row => row[i]).reverse()
    );

    if (!this.collides(state, 0, 0, rotated)) {
      return { ...state, currentPiece: rotated };
    }

    return state;
  }

  /**
   * Moves the piece left if possible.
   */
  moveLeft(state: TetrisState): TetrisState {
    if (!this.collides(state, -1, 0)) {
      return { ...state, posX: state.posX - 1 };
    }
    return state;
  }

  /**
   * Moves the piece right if possible.
   */
  moveRight(state: TetrisState): TetrisState {
    if (!this.collides(state, 1, 0)) {
      return { ...state, posX: state.posX + 1 };
    }
    return state;
  }

  /**
   * Moves the piece down by one row.
   * Returns whether the piece should lock in place.
   */
  moveDown(state: TetrisState): { state: TetrisState; locked: boolean } {
    if (!this.collides(state, 0, 1)) {
      return { state: { ...state, posY: state.posY + 1 }, locked: false };
    }
    return { state, locked: true };
  }
}
