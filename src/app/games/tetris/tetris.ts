import { Component, HostListener, OnDestroy, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TetrisService } from './services/tetris.service';
import { TetrisState } from './models/tetris-state.model';

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './tetris.html',
  styleUrl: './tetris.css',
})
export class Tetris implements OnInit, OnDestroy {

  state!: TetrisState;

  gravityTimer: any = null;
  lockTimer: any = null;

  private cdr = inject(ChangeDetectorRef);
  private game = inject(TetrisService);

  // Touch gesture tracking for mobile controls.
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  /**
   * Starts a new game when the component loads.
   */
  ngOnInit(): void {
    this.startGame();
  }

  /**
   * Resets the game state and spawns the first piece.
   */
  startGame() {
    this.state = this.game.createInitialState();
    this.state = this.game.spawnPiece(this.state);
    this.startGravity();
  }

  restartGame() {
    this.startGame();
  }

  /**
   * Handles the automatic downward movement of the piece.
   * This runs on an interval until the game ends.
   */
  startGravity() {
    if (this.gravityTimer) clearInterval(this.gravityTimer);

    this.gravityTimer = setInterval(() => {
      if (this.state.gameOver) return;

      const result = this.game.moveDown(this.state);

      if (!result.locked) {
        this.state = result.state;
      } else {
        this.state = this.game.mergePiece(this.state);
        this.state = this.game.clearLines(this.state);
        this.state = this.game.spawnPiece(this.state);
      }

      this.cdr.detectChanges();
    }, 800);
  }

  moveLeft() {
    this.state = this.game.moveLeft(this.state);
    this.cdr.detectChanges();
  }

  moveRight() {
    this.state = this.game.moveRight(this.state);
    this.cdr.detectChanges();
  }

  rotate() {
    this.state = this.game.rotate(this.state);
    this.cdr.detectChanges();
  }

  moveDown() {
    const result = this.game.moveDown(this.state);

    if (!result.locked) {
      this.state = result.state;
    } else {
      this.state = this.game.mergePiece(this.state);
      this.state = this.game.clearLines(this.state);
      this.state = this.game.spawnPiece(this.state);
    }

    this.cdr.detectChanges();
  }

  /**
   * Keyboard controls for desktop users.
   * Arrow keys move or rotate the piece.
   */
  @HostListener('window:keydown', ['$event'])
  handleKey(event: KeyboardEvent) {
    if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
      event.preventDefault();
    }

    if (this.state.gameOver) return;

    if (event.key === 'ArrowLeft') this.moveLeft();
    if (event.key === 'ArrowRight') this.moveRight();
    if (event.key === 'ArrowDown') this.moveDown();
    if (event.key === 'ArrowUp') this.rotate();
  }

  /**
   * Records the starting point of a swipe gesture.
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  }

  /**
   * Records the end point of a swipe and triggers movement.
   */
  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  }

  /**
   * Detects swipe direction and maps it to Tetris actions.
   * Horizontal = move left/right
   * Vertical up = rotate
   * Vertical down = soft drop
   */
  private handleSwipe() {
    const dx = this.touchEndX - this.touchStartX;
    const dy = this.touchEndY - this.touchStartY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (this.state.gameOver) return;

    if (absDx > absDy) {
      if (dx > 0) this.moveRight();
      else this.moveLeft();
    } else {
      if (dy > 0) this.moveDown();
      else this.rotate();
    }
  }

  /**
   * Cleans up timers when the component is destroyed.
   */
  ngOnDestroy(): void {
    if (this.gravityTimer) clearInterval(this.gravityTimer);
    if (this.lockTimer) clearTimeout(this.lockTimer);
  }

  /**
 * Exposes the current score to the template.
 * Using a getter keeps the template clean and avoids direct state access.
 */
get score() {
  return this.state.score;
}

/**
 * Exposes the board matrix so the template can render each cell.
 */
get board() {
  return this.state.board;
}

/**
 * Indicates whether the game has ended.
 * Used by the template to show the game-over modal.
 */
get gameOver() {
  return this.state.gameOver;
}

/**
 * Returns the color value for a given board coordinate.
 * This method checks both the locked blocks on the board and the active falling piece.
 * If the active piece overlaps the requested cell, its color takes priority.
 */
getColorAt(x: number, y: number): number {
  // Base color from the board (locked blocks)
  let color = this.state.board[y][x];

  const piece = this.state.currentPiece;
  const posX = this.state.posX;
  const posY = this.state.posY;

  // Check if the active piece occupies this cell
  if (
    y >= posY &&
    y < posY + piece.length &&
    x >= posX &&
    x < posX + piece[0].length &&
    piece[y - posY][x - posX] === 1
  ) {
    color = this.state.currentColor;
  }

  return color;
}

}
