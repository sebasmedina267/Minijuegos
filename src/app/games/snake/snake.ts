import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  HostListener,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChangeDetectorRef, inject } from '@angular/core';

type Point = { x: number; y: number };

@Component({
  selector: 'app-snake',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './snake.html',
  styleUrls: ['./snake.css'],
})
export class Snake implements AfterViewInit {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  ctx!: CanvasRenderingContext2D;

  // Angular change detector (used to update UI state)
  cdr = inject(ChangeDetectorRef);

  // Size of each grid tile (snake moves in increments of this size)
  tile = 20;

  // Total board size (square canvas)
  boardSize = 600;

  // Snake body represented as an array of points (head = index 0)
  snake: Point[] = [];

  // Current movement direction
  direction: Point = { x: this.tile, y: 0 };

  // Buffered direction to avoid reversing instantly
  nextDirection: Point = this.direction;

  // Current food position
  food: Point = { x: 0, y: 0 };

  // Game state flags
  gameOver = false;
  score = 0;
  started = false; // true once the player presses START
  paused = false; // toggled with PAUSE button

  // Game speed (lower = faster)
  speed = 120;

  // Timestamp used to throttle updates inside requestAnimationFrame
  lastTime = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    // Prevent canvas logic from running during SSR
    if (!isPlatformBrowser(this.platformId)) return;

    // Configure canvas size
    const canvas = this.canvas.nativeElement;
    canvas.width = this.boardSize;
    canvas.height = this.boardSize;

    // Get 2D rendering context
    this.ctx = canvas.getContext('2d')!;

    // Initialize game state
    this.resetGame();
    this.draw();
  }

  /**
   * Main game loop executed via requestAnimationFrame.
   * Handles timing, updates, and rendering.
   */
  loop = (time: number) => {
    // Stop loop if game is not active
    if (this.gameOver || !this.started || this.paused) return;

    // Throttle updates based on speed
    if (time - this.lastTime > this.speed) {
      this.update();
      this.draw();
      this.lastTime = time;

      // Force Angular to update UI bindings (score, buttons, etc.)
      this.cdr.detectChanges();
    }

    requestAnimationFrame(this.loop);
  };

  /**
   * Keyboard input handler.
   * Prevents reversing direction and prevents page scrolling.
   */
  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.started || this.paused) return;

    const map: Record<string, Point> = {
      ArrowUp: { x: 0, y: -this.tile },
      ArrowDown: { x: 0, y: this.tile },
      ArrowLeft: { x: -this.tile, y: 0 },
      ArrowRight: { x: this.tile, y: 0 },
    };

    // Prevent browser from scrolling with arrow keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    if (!map[e.key]) return;

    const newDir = map[e.key];

    // Prevent reversing direction (e.g., going left → right instantly)
    if (newDir.x === -this.direction.x && newDir.y === -this.direction.y) return;

    this.nextDirection = newDir;
  }

  /**
   * Core game logic:
   * - Moves the snake
   * - Detects collisions
   * - Handles food consumption
   * - Grows the snake
   */
  update() {
    this.direction = this.nextDirection;

    // Compute new head position
    const head: Point = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    // Wall collision
    if (head.x < 0 || head.x >= this.boardSize || head.y < 0 || head.y >= this.boardSize) {
      this.endGame();
      return;
    }

    // Self collision
    if (this.snake.some((p) => p.x === head.x && p.y === head.y)) {
      this.endGame();
      return;
    }

    // Add new head
    this.snake.unshift(head);

    // Check if food is eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.food = this.generateFood();
      this.speed = Math.max(60, this.speed - 3); // Increase difficulty
    } else {
      // Remove tail if no food eaten
      this.snake.pop();
    }
  }

  /**
   * Generates a random food position that does not overlap the snake.
   */
  generateFood(): Point {
    let newFood: Point;
    do {
      const max = this.boardSize / this.tile;
      newFood = {
        x: Math.floor(Math.random() * max) * this.tile,
        y: Math.floor(Math.random() * max) * this.tile,
      };
    } while (this.snake.some((p) => p.x === newFood.x && p.y === newFood.y));

    return newFood;
  }

  /**
   * Draws the entire game:
   * - Background gradient
   * - Neon grid
   * - Snake (head + body)
   * - Food (glowing orb)
   */
  draw() {
    const ctx = this.ctx;

    // Background radial gradient
    const bgGradient = ctx.createRadialGradient(
      this.boardSize / 2,
      this.boardSize / 2,
      50,
      this.boardSize / 2,
      this.boardSize / 2,
      this.boardSize,
    );
    bgGradient.addColorStop(0, '#1a1c2c');
    bgGradient.addColorStop(1, '#0a0b11');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.boardSize, this.boardSize);

    // Neon grid
    ctx.strokeStyle = 'rgba(0, 234, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= this.boardSize; i += this.tile) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, this.boardSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(this.boardSize, i);
      ctx.stroke();
    }

    // Draw snake
    this.snake.forEach((p, i) => {
      ctx.save();

      if (i === 0) {
        // Snake head with glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(p.x + 1, p.y + 1, this.tile - 2, this.tile - 2, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        ctx.beginPath();
        ctx.arc(p.x + this.tile * 0.3, p.y + this.tile * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.arc(p.x + this.tile * 0.7, p.y + this.tile * 0.3, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Body with fading opacity
        const alpha = Math.max(0.3, 1 - i / this.snake.length);
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
        ctx.beginPath();
        ctx.roundRect(p.x + 2, p.y + 2, this.tile - 4, this.tile - 4, 4);
        ctx.fill();
      }

      ctx.restore();
    });

    // Food (glowing orb)
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(
      this.food.x + this.tile / 2,
      this.food.y + this.tile / 2,
      this.tile / 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Inner glow
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(
      this.food.x + this.tile / 2,
      this.food.y + this.tile / 2,
      this.tile / 6,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  /**
   * Resets all game variables to their initial state.
   */
  resetGame() {
    this.snake = [{ x: 200, y: 200 }];
    this.direction = { x: this.tile, y: 0 };
    this.nextDirection = this.direction;
    this.food = this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.speed = 120;
    this.started = false;
    this.paused = false;
    this.draw();
  }

  /**
   * Sets the game over flag and stops the loop.
   */
  endGame() {
    this.gameOver = true;
  }

  /**
   * Restarts the game completely.
   */
  restart() {
    this.resetGame();
  }

  /**
   * Starts the game loop.
   */
  startGame() {
    if (this.started) return;
    this.started = true;
    this.paused = false;
    requestAnimationFrame(this.loop);
  }

  /**
   * Toggles pause state.
   */
  togglePause() {
    if (!this.started || this.gameOver) return;
    this.paused = !this.paused;
    this.draw();

    if (!this.paused) requestAnimationFrame(this.loop);

    this.cdr.detectChanges();
  }
}
