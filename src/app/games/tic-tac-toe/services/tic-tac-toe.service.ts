import { Injectable } from '@angular/core';

export type Player = 'X' | 'O' | null;

@Injectable({
  providedIn: 'root',
})
export class TicTacToeService {
  board: Player[] = Array(9).fill(null);
  currentPlayer: Player = 'X';
  winner: Player = null;
  isDraw = false;
  winningLine: number[] = [];

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.isDraw = false;
    this.winningLine = [];
  }

  play(index: number) {
    if (this.board[index] || this.winner) return;

    this.board[index] = this.currentPlayer;

    if (this.checkWinner()) {
      this.winner = this.currentPlayer;
      return;
    }

    if (this.board.every(c => c !== null)) {
      this.isDraw = true;
      return;
    }

    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
  }

  private checkWinner(): boolean {
    const wins = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6],
    ];

    for (const line of wins) {
      const [a, b, c] = line;
      if (
        this.board[a] &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        this.winningLine = line;
        return true;
      }
    }

    return false;
  }

  getStatus(): string {
    if (this.winner) return `Ganador: ${this.winner}`;
    if (this.isDraw) return 'Empate';
    return `Turno de: ${this.currentPlayer}`;
  }
}
