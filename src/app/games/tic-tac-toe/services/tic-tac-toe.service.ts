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

  // Modo de juego: true = contra IA, false = 2 jugadores
  isVsAI = true;

  reset() {
    this.board = Array(9).fill(null);
    this.currentPlayer = 'X';
    this.winner = null;
    this.isDraw = false;
    this.winningLine = [];
  }

  play(index: number) {
    if (this.board[index] || this.winner) return;

    // Movimiento del jugador actual (humano si isVsAI y currentPlayer === 'X')
    this.board[index] = this.currentPlayer;

    if (this.checkWinner()) {
      this.winner = this.currentPlayer;
      return;
    }

    if (this.board.every(c => c !== null)) {
      this.isDraw = true;
      return;
    }

    // Cambiar turno
    this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';

    // Si es contra IA y ahora le toca a la IA
    if (this.isVsAI && this.currentPlayer === 'O' && !this.winner && !this.isDraw) {
      this.aiMove();
    }
  }

  private aiMove() {
    const best = this.minimax([...this.board], 'O');
    if (best.index !== undefined && this.board[best.index] === null) {
      this.board[best.index] = 'O';
    }

    if (this.checkWinner()) {
      this.winner = 'O';
      return;
    }

    if (this.board.every(c => c !== null)) {
      this.isDraw = true;
      return;
    }

    this.currentPlayer = 'X';
  }

  private minimax(board: Player[], player: Player): { index?: number; score: number } {
    const opponent: Player = player === 'O' ? 'X' : 'O';

    if (this.checkWinnerFor(board, 'X')) return { score: -10 };
    if (this.checkWinnerFor(board, 'O')) return { score: 10 };
    if (board.every(c => c !== null)) return { score: 0 };

    const moves: { index: number; score: number }[] = [];

    for (let i = 0; i < board.length; i++) {
      if (board[i] === null) {
        const move: { index: number; score: number } = { index: i, score: 0 };
        board[i] = player;

        const result = this.minimax(board, opponent);
        move.score = result.score;

        board[i] = null;
        moves.push(move);
      }
    }

    let bestMove: { index: number; score: number } = moves[0];

    if (player === 'O') {
      // Maximiza IA
      let bestScore = -Infinity;
      for (const m of moves) {
        if (m.score > bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      }
    } else {
      // Minimiza jugador
      let bestScore = Infinity;
      for (const m of moves) {
        if (m.score < bestScore) {
          bestScore = m.score;
          bestMove = m;
        }
      }
    }

    return bestMove;
  }

  private checkWinnerFor(board: Player[], player: Player): boolean {
    const wins = [
      [0,1,2], [3,4,5], [6,7,8],
      [0,3,6], [1,4,7], [2,5,8],
      [0,4,8], [2,4,6],
    ];

    return wins.some(([a, b, c]) =>
      board[a] === player &&
      board[b] === player &&
      board[c] === player
    );
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
