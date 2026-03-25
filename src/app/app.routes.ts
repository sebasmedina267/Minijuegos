import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home').then(m => m.Home),
    children: [
      { path: 'tic-tac-toe', loadComponent: () => import('./games/tic-tac-toe/tic-tac-toe').then(m => m.TicTacToe) },
      { path: 'tetris', loadComponent: () => import('./games/tetris/tetris').then(m => m.Tetris) },
      { path: 'pong', loadComponent: () => import('./games/pong/pong').then(m => m.Pong) },
      { path: 'sudoku', loadComponent: () => import('./games/sudoku/sudoku').then(m => m.SudokuComponent) },
      { path: 'snake', loadComponent: () => import('./games/snake/snake').then(m => m.Snake) },
      { path: '2048', loadComponent: () => import('./games/game-2048/game-2048').then(m => m.Game2048) },
      { path: 'memory', loadComponent: () => import('./games/memory/memory').then(m => m.Memory) },
      { path: 'minesweeper', loadComponent: () => import('./games/minesweeper/minesweeper').then(m => m.Minesweeper) },
    ],
  },
  { path: '**', redirectTo: '' },
];
