import { Component, HostListener, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Tile {
  value: number;
  merged?: boolean;
}

@Component({
  selector: 'app-game-2048',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-2048.html',
  styleUrls: ['./game-2048.css'],
})
export class Game2048 {
  size = 4;
  grid: Tile[][] = [];
  score = 0;
  gameOver = false;
  started = false;
  paused = false;

  cdr = inject(ChangeDetectorRef);

  constructor() {
    this.initGrid();
  }

  /* =================== INICIALIZAR TABLERO =================== */
  initGrid() {
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ value: 0 }))
    );
    this.score = 0;
    this.gameOver = false;
    this.started = false;
    this.paused = false;
  }

  /* =================== INICIAR JUEGO =================== */
  startGame() {
    this.initGrid();
    this.addRandomTile();
    this.addRandomTile();
    this.started = true;
    this.paused = false;
    this.cdr.detectChanges();
  }

  /* =================== MOVIMIENTOS =================== */
  move(dir: 'up' | 'down' | 'left' | 'right') {
    if (!this.started || this.gameOver || this.paused) return;

    let moved = false;
    this.resetMergeFlags();

    const rotate = (times: number) => {
      for (let t = 0; t < times; t++) {
        this.grid = this.grid[0].map((_, i) =>
          this.grid.map((row) => row[i]).reverse()
        );
      }
    };

    switch (dir) {
      case 'up': rotate(1); break;
      case 'right': rotate(2); break;
      case 'down': rotate(3); break;
    }

    for (let row = 0; row < this.size; row++) {
      let line = this.grid[row].filter((tile) => tile.value !== 0);
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i].value === line[i + 1].value && !line[i].merged && !line[i + 1].merged) {
          line[i].value *= 2;
          line[i].merged = true;
          line.splice(i + 1, 1);
          this.score += line[i].value;
        }
      }
      while (line.length < this.size) line.push({ value: 0 });
      moved = moved || !line.every((tile, i) => tile.value === this.grid[row][i].value);
      this.grid[row] = line;
    }

    switch (dir) {
      case 'up': rotate(3); break;
      case 'right': rotate(2); break;
      case 'down': rotate(1); break;
    }

    if (moved) this.addRandomTile();
    this.checkGameOver();
    this.cdr.detectChanges();
  }

  resetMergeFlags() {
    this.grid.forEach((row) => row.forEach((tile) => (tile.merged = false)));
  }

  addRandomTile() {
    const empty: { x: number; y: number }[] = [];
    this.grid.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile.value === 0) empty.push({ x, y });
      })
    );
    if (empty.length === 0) return;
    const { x, y } = empty[Math.floor(Math.random() * empty.length)];
    this.grid[y][x].value = Math.random() < 0.9 ? 2 : 4;
  }

  /* =================== GAME OVER =================== */
  checkGameOver() {
    const hasZero = this.grid.some((row) => row.some((tile) => tile.value === 0));
    if (hasZero) return;

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const tile = this.grid[y][x];
        if (
          (x < this.size - 1 && tile.value === this.grid[y][x + 1].value) ||
          (y < this.size - 1 && tile.value === this.grid[y + 1][x].value)
        ) return;
      }
    }
    this.gameOver = true;
  }

  /* =================== PAUSA =================== */
  togglePause() {
    if (!this.started || this.gameOver) return;
    this.paused = !this.paused;
    this.cdr.detectChanges();
  }

  /* =================== TECLAS =================== */
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.started || this.paused || this.gameOver) return;

    switch (e.key) {
      case 'ArrowUp': this.move('up'); break;
      case 'ArrowDown': this.move('down'); break;
      case 'ArrowLeft': this.move('left'); break;
      case 'ArrowRight': this.move('right'); break;
      case 'p': this.togglePause(); break;
    }
  }
}
