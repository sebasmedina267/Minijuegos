import { Component, inject } from '@angular/core';
import { Cell } from './cell/cell';
import { TicTacToeService } from '../services/tic-tac-toe.service';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ Cell],
  templateUrl: './board.html',
  styleUrl: './board.css',
})
export class Board {
  game = inject(TicTacToeService);
  indices = Array.from({ length: 9 }, (_, i) => i);
}
