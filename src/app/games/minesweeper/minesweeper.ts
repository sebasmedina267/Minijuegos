import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

@Component({
  selector: 'app-minesweeper',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './minesweeper.html',
  styleUrls: ['./minesweeper.css'],
})
export class Minesweeper implements OnInit, OnDestroy {
  grid: Cell[][] = [];
  rows = 20;
  cols = 20;
  minesCount = 40;
  gameOver = false;
  gameWon = false;
  minesLeft = 40;
  timer = 0;
  timerInterval: any;
  firstClick = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.initGame();
  }

  initGame() {
    this.gameOver = false;
    this.gameWon = false;
    this.firstClick = true;
    this.minesLeft = this.minesCount;
    this.timer = 0;
    this.stopTimer();
    this.createGrid();
  }

  createGrid() {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Cell[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push({
          row: r,
          col: c,
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      this.grid.push(row);
    }
  }

  placeMines(excludeRow: number, excludeCol: number) {
    let minesPlaced = 0;
    while (minesPlaced < this.minesCount) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);

      // Don't place mine on the first clicked cell or its neighbors
      if (
        !this.grid[r][c].isMine &&
        (Math.abs(r - excludeRow) > 1 || Math.abs(c - excludeCol) > 1)
      ) {
        this.grid[r][c].isMine = true;
        minesPlaced++;
      }
    }
    this.calculateNeighbors();
  }

  calculateNeighbors() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r][c].isMine) {
          this.grid[r][c].neighborMines = this.getNeighbors(r, c).filter(
            (cell) => cell.isMine
          ).length;
        }
      }
    }
  }

  getNeighbors(r: number, c: number): Cell[] {
    const neighbors: Cell[] = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          neighbors.push(this.grid[nr][nc]);
        }
      }
    }
    return neighbors;
  }

  onCellClick(r: number, c: number) {
    if (this.gameOver || this.gameWon || this.grid[r][c].isFlagged) return;

    if (this.firstClick) {
      this.placeMines(r, c);
      this.firstClick = false;
      this.startTimer();
    }

    const cell = this.grid[r][c];
    if (cell.isMine) {
      this.revealMines();
      this.gameOver = true;
      this.stopTimer();
    } else {
      this.revealCell(r, c);
      this.checkWin();
    }
    this.cdr.detectChanges();
  }

  onRightClick(event: MouseEvent, r: number, c: number) {
    event.preventDefault();
    if (this.gameOver || this.gameWon || this.grid[r][c].isRevealed) return;

    const cell = this.grid[r][c];
    cell.isFlagged = !cell.isFlagged;
    this.minesLeft += cell.isFlagged ? -1 : 1;
  }

  revealCell(r: number, c: number) {
    const cell = this.grid[r][c];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;

    if (cell.neighborMines === 0) {
      this.getNeighbors(r, c).forEach((n) => this.revealCell(n.row, n.col));
    }
  }

  revealMines() {
    this.grid.forEach((row) =>
      row.forEach((cell) => {
        if (cell.isMine) cell.isRevealed = true;
      })
    );
  }

  checkWin() {
    const totalCells = this.rows * this.cols;
    const revealedCells = this.grid
      .flat()
      .filter((cell) => cell.isRevealed).length;
    if (revealedCells === totalCells - this.minesCount) {
      this.gameWon = true;
      this.stopTimer();
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timer++;
      this.cdr.detectChanges();
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}
