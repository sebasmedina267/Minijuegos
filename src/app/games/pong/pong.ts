import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ChangeDetectorRef,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pong',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './pong.html',
  styleUrls: ['./pong.css'],
})
export class Pong implements AfterViewInit, OnDestroy {
  // Reference to the canvas element in the template
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  // Canvas dimensions (responsive)
  canvasWidth = 800;
  canvasHeight = 450;
  ctx: CanvasRenderingContext2D | null = null;

  // Paddle settings
  paddleWidth = 12;
  paddleHeight = 110; // slightly larger for better gameplay feel
  playerX = 30;
  playerY = 0;
  aiX = 0;
  aiY = 0;
  paddleSpeed = 8;

  // Ball properties
  ballX = 0;
  ballY = 0;
  ballRadius = 8;
  ballSpeedX = 5;
  ballSpeedY = 0; // starts straight on serve
  maxSpeed = 10;

  // Trail effect for the ball
  trail: { x: number; y: number }[] = [];
  maxTrail = 10;

  // Game state
  playerScore = 0;
  aiScore = 0;
  timeLeft = 60;
  difficulty: 'easy' | 'normal' | 'hard' = 'normal';

  // AI behavior tuning
  aiSpeed = 1.0;           // how fast the AI paddle moves
  aiError = 15;            // how inaccurate the AI can be
  aiBaseReaction = 15;     // delay before AI reacts

  gameStarted = false;
  gameEnded = false;

  // Input state
  private upPressed = false;
  private downPressed = false;

  // Animation loop control
  private animationId: number | null = null;
  private lastTime = 0;
  private timerAccumulator = 0;

  // AI internal state
  private aiReactionDelay = 0;
  private aiTargetY = 0;

  /**
   * Initialize canvas after view is ready (browser only)
   */
  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      this.initCanvas();
      this.draw();
      this.cdr.detectChanges();
    }, 50);
  }

  /**
   * Setup canvas size and context
   */
  initCanvas() {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;

    // Make canvas responsive but keep aspect ratio
    this.canvasWidth = Math.min(window.innerWidth * 0.9, 1000);
    this.canvasHeight = this.canvasWidth * 0.5;

    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    this.ctx = canvas.getContext('2d');

    // Initial positions
    this.resetPositions(true);
  }

  /**
   * Starts a new game session
   */
  startGame() {
    this.gameStarted = true;
    this.gameEnded = false;

    // Reset scores and timer
    this.playerScore = 0;
    this.aiScore = 0;
    this.timeLeft = 60;
    this.timerAccumulator = 0;

    this.applyDifficulty();
    this.resetPositions(true);

    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.lastTime = performance.now();
    this.loop(this.lastTime);

    this.cdr.detectChanges();
  }

  /**
   * Adjust AI behavior depending on difficulty level
   */
  applyDifficulty() {
    if (this.difficulty === 'easy') {
      this.aiSpeed = 0.4;
      this.aiError = 120;
      this.aiBaseReaction = 30;
    } else if (this.difficulty === 'normal') {
      this.aiSpeed = 0.7;
      this.aiError = 60;
      this.aiBaseReaction = 20;
    } else {
      this.aiSpeed = 1.1;
      this.aiError = 15;
      this.aiBaseReaction = 10;
    }
  }

  changeDifficulty(level: 'easy' | 'normal' | 'hard') {
    this.difficulty = level;
    this.cdr.detectChanges();
  }

  resetGame() {
    this.startGame();
  }

  /**
   * Reset positions after a goal or at game start
   * Ball always spawns in the center and goes straight
   */
  resetPositions(fromStart = false) {
    this.aiX = this.canvasWidth - 30 - this.paddleWidth;

    this.playerY = this.canvasHeight / 2 - this.paddleHeight / 2;
    this.aiY = this.canvasHeight / 2 - this.paddleHeight / 2;

    // Ball always resets to center
    this.ballX = this.canvasWidth / 2;
    this.ballY = this.canvasHeight / 2;

    // Random direction (left or right)
    const direction = Math.random() > 0.5 ? 1 : -1;

    this.ballSpeedX = 5 * direction;
    this.ballSpeedY = 0;

    this.trail = [];

    // Reset AI tracking
    this.aiReactionDelay = 0;
    this.aiTargetY = this.ballY;
  }

  /**
   * Stops the game loop
   */
  endGame() {
    this.gameEnded = true;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.cdr.detectChanges();
  }

  /**
   * Main game loop (runs every frame)
   */
  loop = (currentTime: number) => {
    if (!this.gameStarted || this.gameEnded) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Update countdown timer
    this.timerAccumulator += deltaTime;
    if (this.timerAccumulator >= 1000) {
      this.timeLeft--;
      this.timerAccumulator -= 1000;

      if (this.timeLeft <= 0) {
        this.endGame();
        return;
      }
    }

    this.update();
    this.draw();

    this.cdr.detectChanges();
    this.animationId = requestAnimationFrame(this.loop);
  };

  /**
   * Game logic update (movement, collisions, AI)
   */
  update() {
    // --- PLAYER MOVEMENT ---
    if (this.upPressed) this.playerY -= this.paddleSpeed;
    if (this.downPressed) this.playerY += this.paddleSpeed;

    // Keep player inside canvas
    this.playerY = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.playerY));

    // --- AI LOGIC (with delay + randomness) ---
    this.aiReactionDelay--;

    if (this.aiReactionDelay <= 0) {
      this.aiReactionDelay = Math.floor(
        this.aiBaseReaction + Math.random() * this.aiBaseReaction
      );

      const speedFactor = Math.abs(this.ballSpeedX) * 2;

      // Add randomness so AI isn't perfect
      this.aiTargetY =
        this.ballY +
        (Math.random() * (this.aiError + speedFactor) -
          (this.aiError + speedFactor) / 2);
    }

    const aiCenter = this.aiY + this.paddleHeight / 2;

    if (aiCenter < this.aiTargetY) {
      this.aiY += this.paddleSpeed * this.aiSpeed;
    } else if (aiCenter > this.aiTargetY) {
      this.aiY -= this.paddleSpeed * this.aiSpeed;
    }

    // Clamp AI position
    this.aiY = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.aiY));

    // --- BALL MOVEMENT ---
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Bounce on top/bottom walls
    if (this.ballY - this.ballRadius < 0 || this.ballY + this.ballRadius > this.canvasHeight) {
      this.ballSpeedY *= -1;
    }

    // --- PLAYER COLLISION ---
    if (
      this.ballX - this.ballRadius < this.playerX + this.paddleWidth &&
      this.ballX > this.playerX &&
      this.ballY > this.playerY &&
      this.ballY < this.playerY + this.paddleHeight
    ) {
      const center = this.playerY + this.paddleHeight / 2;

      this.ballSpeedX = Math.abs(this.ballSpeedX) * 1.05;
      this.ballSpeedY += (this.ballY - center) * 0.05;
    }

    // --- AI COLLISION (with error) ---
    if (
      this.ballX + this.ballRadius > this.aiX &&
      this.ballX < this.aiX + this.paddleWidth &&
      this.ballY > this.aiY &&
      this.ballY < this.aiY + this.paddleHeight
    ) {
      const center = this.aiY + this.paddleHeight / 2;

      // Add imperfection so AI misses sometimes
      const hitError = (Math.random() - 0.5) * this.aiError * 0.1;

      this.ballSpeedX = -Math.abs(this.ballSpeedX) * 1.05;
      this.ballSpeedY += (this.ballY - center + hitError) * 0.05;
    }

    // Limit ball speed
    this.ballSpeedX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.ballSpeedX));
    this.ballSpeedY = Math.max(-6, Math.min(6, this.ballSpeedY));

    // --- SCORE ---
    if (this.ballX < 0) {
      this.aiScore++;
      this.resetPositions();
    }

    if (this.ballX > this.canvasWidth) {
      this.playerScore++;
      this.resetPositions();
    }

    // --- TRAIL EFFECT ---
    this.trail.push({ x: this.ballX, y: this.ballY });
    if (this.trail.length > this.maxTrail) this.trail.shift();
  }

  /**
   * Draw everything on canvas
   */
  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Center dashed line
    ctx.strokeStyle = 'rgba(0, 234, 255, 0.2)';
    ctx.setLineDash([15, 10]);

    ctx.beginPath();
    ctx.moveTo(this.canvasWidth / 2, 0);
    ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    // Ball trail
    this.trail.forEach((t, i) => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.ballRadius * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249, 115, 22, ${i / (this.trail.length * 2)})`;
      ctx.fill();
    });

    // Player paddle
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00eaff';
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(this.playerX, this.playerY, this.paddleWidth, this.paddleHeight);

    // AI paddle
    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.aiX, this.aiY, this.paddleWidth, this.paddleHeight);

    // Ball
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f97316';
    ctx.fillStyle = '#f97316';

    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  /**
   * Handle key press
   */
  @HostListener('window:keydown', ['$event'])
  keyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) e.preventDefault();

    if (e.key === 'ArrowUp' || e.key === 'w') this.upPressed = true;
    if (e.key === 'ArrowDown' || e.key === 's') this.downPressed = true;

    this.cdr.detectChanges();
  }

  /**
   * Handle key release
   */
  @HostListener('window:keyup', ['$event'])
  keyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w') this.upPressed = false;
    if (e.key === 'ArrowDown' || e.key === 's') this.downPressed = false;

    this.cdr.detectChanges();
  }

  /**
   * Cleanup on destroy
   */
  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
