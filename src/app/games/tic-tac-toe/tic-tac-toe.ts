import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { Board } from './board/board';
import { TicTacToeService } from './services/tic-tac-toe.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tic-tac-toe',
  standalone: true,
  imports: [Board, CommonModule, RouterLink],
  templateUrl: './tic-tac-toe.html',
  styleUrl: './tic-tac-toe.css',
})
export class TicTacToe {
  game = inject(TicTacToeService);
  cdr = inject(ChangeDetectorRef);

  reset() {
    this.game.reset();
    this.cdr.detectChanges();
  }

  toggleAI() {
    this.game.isVsAI = !this.game.isVsAI;
    this.reset();
  }

  get status() {
    return this.game.getStatus();
  }

  refresh() {
    this.cdr.detectChanges();
  }
}
