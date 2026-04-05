import { Component, HostListener, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Game2048Service, Direction } from './services/game-2048.service';
import { GameState } from './models/game-state.model';

@Component({
  selector: 'app-game-2048',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-2048.html',
  styleUrls: ['./game-2048.css'],
})
export class Game2048 implements OnInit {
  state!: GameState;

  private cdr = inject(ChangeDetectorRef);
  private game = inject(Game2048Service);

  // Touch coordinates used to detect swipe gestures on mobile devices.
  private touchStartX = 0;
  private touchStartY = 0;
  private touchEndX = 0;
  private touchEndY = 0;

  constructor() {
    // Initialize the game with an empty board.
    this.state = this.game.createInitialState(4);
  }

  /**
   * Prevents the browser from scrolling when swiping on mobile.
   * This ensures a native app-like experience.
   */
  ngOnInit() {
    document.addEventListener(
      'touchmove',
      (e) => e.preventDefault(),
      { passive: false } // 🔥 required for preventDefault to work
    );
  }

  /**
   * Starts or restarts the game.
   * Resets the board and places the first two tiles.
   */
  startGame() {
    this.state = this.game.start(this.state);
    this.cdr.detectChanges();
  }

  /**
   * Applies a movement in the given direction.
   * The actual game logic is handled by the service.
   */
  move(dir: Direction) {
    this.state = this.game.move(this.state, dir);
    this.cdr.detectChanges();
  }

  /**
   * Toggles the pause state.
   */
  togglePause() {
    this.state = this.game.togglePause(this.state);
    this.cdr.detectChanges();
  }

  /**
   * Handles keyboard input.
   * Arrow keys trigger movement, and 'p' toggles pause.
   * Prevents the browser from scrolling when using arrow keys.
   */
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
      e.preventDefault();
    }

    if (!this.state.started || this.state.paused || this.state.gameOver) return;

    switch (e.key) {
      case 'ArrowUp': this.move('up'); break;
      case 'ArrowDown': this.move('down'); break;
      case 'ArrowLeft': this.move('left'); break;
      case 'ArrowRight': this.move('right'); break;
      case 'p': this.togglePause(); break;
    }
  }

  /**
   * Stores the initial touch position when the user starts a swipe.
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent) {
    e.preventDefault(); // 🔥 prevents scroll
    this.touchStartX = e.changedTouches[0].screenX;
    this.touchStartY = e.changedTouches[0].screenY;
  }

  /**
   * Stores the final touch position and triggers swipe detection.
   */
  @HostListener('touchend', ['$event'])
  onTouchEnd(e: TouchEvent) {
    e.preventDefault(); // 🔥 prevents scroll
    this.touchEndX = e.changedTouches[0].screenX;
    this.touchEndY = e.changedTouches[0].screenY;
    this.handleSwipe();
  }

  /**
   * Detects the direction of a swipe gesture.
   * Horizontal swipes move left/right, vertical swipes move up/down.
   */
  private handleSwipe() {
    const dx = this.touchEndX - this.touchStartX;
    const dy = this.touchEndY - this.touchStartY;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const threshold = 30; // 🔥 minimum distance to trigger swipe

    if (!this.state.started || this.state.paused || this.state.gameOver) return;

    if (absDx > absDy) {
      // Horizontal swipe
      if (dx > threshold) this.move('right');
      else if (dx < -threshold) this.move('left');
    } else {
      // Vertical swipe
      if (dy > threshold) this.move('down');
      else if (dy < -threshold) this.move('up');
    }
  }

  // Getters used by the template for cleaner bindings.
  get grid() { return this.state.grid; }
  get score() { return this.state.score; }
  get gameOver() { return this.state.gameOver; }
  get started() { return this.state.started; }
  get paused() { return this.state.paused; }
}
