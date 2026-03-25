import { Component, Input, inject } from '@angular/core';
import { TicTacToeService } from '../../services/tic-tac-toe.service';
import { TicTacToe } from '../../tic-tac-toe';

@Component({
  selector: 'app-cell',
  standalone: true,
  templateUrl: './cell.html',
  styleUrl: './cell.css',
})
export class Cell {
  @Input({ required: true }) index!: number;

  game = inject(TicTacToeService);
  parent = inject(TicTacToe);

  get value() {
    return this.game.board[this.index];
  }

  get disabled() {
    return this.value !== null || this.game.winner !== null || this.game.isDraw;
  }

  get isWinningCell() {
    return this.game.winningLine.includes(this.index);
  }

  onClick() {
    if (this.disabled) return;
    this.game.play(this.index);
    this.parent.refresh();
  }
}
