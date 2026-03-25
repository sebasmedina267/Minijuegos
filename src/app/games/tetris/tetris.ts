import { CommonModule } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './tetris.html',
  styleUrl: './tetris.css',
})
export class Tetris implements OnInit, OnDestroy {
  rows = 20;
  cols = 10;
  board: number[][] = [];
  score = 0;

  pieces = [
    { shape: [[1,1,1,1]], color: 1 },
    { shape: [[1,1],[1,1]], color: 2 },
    { shape: [[0,1,0],[1,1,1]], color: 3 },
    { shape: [[1,0,0],[1,1,1]], color: 4 },
    { shape: [[0,0,1],[1,1,1]], color: 5 },
    { shape: [[1,1,0],[0,1,1]], color: 6 },
    { shape: [[0,1,1],[1,1,0]], color: 7 }
  ];

  currentPiece: number[][] = [];
  currentColor = 0;

  posX = 0;
  posY = 0;

  gameOver = false;

  lockDelay = 300;
  lockTimer: any = null;
  gravityTimer: any = null;

  cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.startGame();
  }


  startGame() {
    this.gameOver = false;
    this.score = 0;
    this.resetBoard();
    this.spawnPiece();
    this.startGravity();
  }

  restartGame() {
    this.startGame();
  }

  resetBoard() {
    this.board = Array.from({ length: this.rows }, () =>
      Array(this.cols).fill(0)
    );
  }

  spawnPiece() {
    const random = this.pieces[Math.floor(Math.random() * this.pieces.length)];

    this.currentPiece = JSON.parse(JSON.stringify(random.shape));
    this.currentColor = random.color;

    this.posX = Math.floor(this.cols / 2) - 2;
    this.posY = 0;

    if (this.collides()) {
      this.gameOver = true;
    }
  }

  collides(offsetX = 0, offsetY = 0, piece = this.currentPiece) {
    for (let y = 0; y < piece.length; y++) {
      for (let x = 0; x < piece[y].length; x++) {
        if (piece[y][x]) {
          const newX = this.posX + x + offsetX;
          const newY = this.posY + y + offsetY;

          if (
            newX < 0 ||
            newX >= this.cols ||
            newY >= this.rows ||
            (newY >= 0 && this.board[newY][newX] !== 0)
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  mergePiece() {
    for (let y = 0; y < this.currentPiece.length; y++) {
      for (let x = 0; x < this.currentPiece[y].length; x++) {
        if (this.currentPiece[y][x]) {
          this.board[this.posY + y][this.posX + x] = this.currentColor;
        }
      }
    }
  }

  clearLines() {
    let cleared = 0;

    for (let y = this.rows - 1; y >= 0; y--) {
      let full = true;

      for (let x = 0; x < this.cols; x++) {
        if (this.getColorAt(x, y) === 0) {
          full = false;
          break;
        }
      }

      if (full) {
        this.board.splice(y, 1);
        this.board.unshift(Array(this.cols).fill(0));
        cleared++;
        y++;
      }
    }

    if (cleared > 0) {
      this.score += cleared * 100;
    }
  }

  moveDown() {
    if (this.gameOver) return;

    if (!this.collides(0, 1)) {
      this.posY++;

      if (this.lockTimer) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }

    } else {
      if (!this.lockTimer) {
        this.lockTimer = setTimeout(() => {
          this.mergePiece();
          this.clearLines();
          this.spawnPiece();
          this.lockTimer = null;
          this.cdr.detectChanges();
        }, this.lockDelay);
      }
    }
    this.cdr.detectChanges();
  }

  startGravity() {
    if (this.gravityTimer) clearInterval(this.gravityTimer);
    this.gravityTimer = setInterval(() => {
      if (!this.gameOver) {
        this.moveDown();
        this.cdr.detectChanges();
      } else {
        clearInterval(this.gravityTimer);
      }
    }, 1000);
  }

  moveLeft() {
    if (!this.collides(-1, 0)) {
      this.posX--;
      if (this.lockTimer) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }
    }
  }

  moveRight() {
    if (!this.collides(1, 0)) {
      this.posX++;
      if (this.lockTimer) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }
    }
  }

  rotate() {
    const rotated = this.currentPiece[0].map((_, i) =>
      this.currentPiece.map(row => row[i]).reverse()
    );

    if (!this.collides(0, 0, rotated)) {
      this.currentPiece = rotated;

      if (this.lockTimer) {
        clearTimeout(this.lockTimer);
        this.lockTimer = null;
      }
      this.cdr.detectChanges();
    }
  }

  getColorAt(x: number, y: number): number {
    let color = this.board[y][x];

    if (
      y >= this.posY &&
      y < this.posY + this.currentPiece.length &&
      x >= this.posX &&
      x < this.posX + this.currentPiece[0].length &&
      this.currentPiece[y - this.posY][x - this.posX] === 1
    ) {
      color = this.currentColor;
    }

    return color;
  }

  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }

    if (this.gameOver) return;

    if (event.key === 'ArrowLeft') this.moveLeft();
    if (event.key === 'ArrowRight') this.moveRight();
    if (event.key === 'ArrowDown') this.moveDown();
    if (event.key === 'ArrowUp') this.rotate();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.gravityTimer) clearInterval(this.gravityTimer);
    if (this.lockTimer) clearTimeout(this.lockTimer);
  }
}
