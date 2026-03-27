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
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  canvasWidth = 800;
  canvasHeight = 450;
  ctx: CanvasRenderingContext2D | null = null;

  // Paddle
  paddleWidth = 12;
  paddleHeight = 80;
  playerX = 30;
  playerY = 0;
  aiX = 0;
  aiY = 0;
  paddleSpeed = 8;

  // Ball
  ballX = 0;
  ballY = 0;
  ballRadius = 8;
  ballSpeedX = 5;
  ballSpeedY = 3;
  maxSpeed = 10;

  // Trail
  trail: { x: number; y: number }[] = [];
  maxTrail = 10;

  // Score & game
  playerScore = 0;
  aiScore = 0;
  timeLeft = 60;
  difficulty: 'easy' | 'normal' | 'hard' = 'normal';
  aiSpeed = 1.0;
  aiError = 15;

  gameStarted = false;
  gameEnded = false;

  private upPressed = false;
  private downPressed = false;
  private animationId: number | null = null;
  private lastTime = 0;
  private timerAccumulator = 0;

  
  private aiReactionDelay = 0;
  private aiTargetY = 0;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => {
      this.initCanvas();
      this.draw();
      this.cdr.detectChanges();
    }, 50);
  }

  initCanvas() {
    if (!this.canvasRef) return;

    const canvas = this.canvasRef.nativeElement;
    this.canvasWidth = Math.min(window.innerWidth * 0.9, 1000);
    this.canvasHeight = this.canvasWidth * 0.5;

    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    this.ctx = canvas.getContext('2d');
    this.resetPositions();
  }

  startGame() {
    this.gameStarted = true;
    this.gameEnded = false;
    this.playerScore = 0;
    this.aiScore = 0;
    this.timeLeft = 60;
    this.timerAccumulator = 0;

    this.applyDifficulty();
    this.resetPositions();

    if (this.animationId) cancelAnimationFrame(this.animationId);

    this.lastTime = performance.now();
    this.loop(this.lastTime);

    this.cdr.detectChanges();
  }

  applyDifficulty() {
    if (this.difficulty === 'easy') {
      this.aiSpeed = 0.5;
      this.aiError = 80;
    } else if (this.difficulty === 'normal') {
      this.aiSpeed = 0.8;
      this.aiError = 40;
    } else {
      this.aiSpeed = 1.1;
      this.aiError = 10;
    }
  }

  changeDifficulty(level: 'easy' | 'normal' | 'hard') {
    this.difficulty = level;
    this.cdr.detectChanges();
  }

  resetGame() {
    this.startGame();
  }

  resetPositions() {
    this.aiX = this.canvasWidth - 30 - this.paddleWidth;
    this.playerY = this.canvasHeight / 2 - this.paddleHeight / 2;
    this.aiY = this.canvasHeight / 2 - this.paddleHeight / 2;

    this.ballX = this.canvasWidth / 2;
    this.ballY = this.canvasHeight / 2;

    this.ballSpeedX = Math.random() > 0.5 ? 5 : -5;
    this.ballSpeedY = Math.random() * 4 - 2 || 2;

    this.trail = [];

    // reset IA
    this.aiReactionDelay = 0;
    this.aiTargetY = this.ballY;
  }

  endGame() {
    this.gameEnded = true;

    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.cdr.detectChanges();
  }

  loop = (currentTime: number) => {
    if (!this.gameStarted || this.gameEnded) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

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

  update() {
    // PLAYER
    if (this.upPressed) this.playerY -= this.paddleSpeed;
    if (this.downPressed) this.playerY += this.paddleSpeed;

    this.playerY = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.playerY));

    this.aiReactionDelay--;

    if (this.aiReactionDelay <= 0) {
      this.aiReactionDelay = Math.floor(10 + Math.random() * 20);

      this.aiTargetY = this.ballY + (Math.random() * this.aiError - this.aiError / 2);
    }

    const aiCenter = this.aiY + this.paddleHeight / 2;

    if (aiCenter < this.aiTargetY) {
      this.aiY += this.paddleSpeed * this.aiSpeed;
    } else if (aiCenter > this.aiTargetY) {
      this.aiY -= this.paddleSpeed * this.aiSpeed;
    }

    this.aiY = Math.max(0, Math.min(this.canvasHeight - this.paddleHeight, this.aiY));

    // BALL
    this.ballX += this.ballSpeedX;
    this.ballY += this.ballSpeedY;

    // Rebote arriba/abajo
    if (this.ballY - this.ballRadius < 0 || this.ballY + this.ballRadius > this.canvasHeight) {
      this.ballSpeedY *= -1;
    }

    // PLAYER COLLISION
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

    // AI COLLISION
    if (
      this.ballX + this.ballRadius > this.aiX &&
      this.ballX < this.aiX + this.paddleWidth &&
      this.ballY > this.aiY &&
      this.ballY < this.aiY + this.paddleHeight
    ) {
      const center = this.aiY + this.paddleHeight / 2;

      this.ballSpeedX = -Math.abs(this.ballSpeedX) * 1.05;
      this.ballSpeedY += (this.ballY - center) * 0.05;
    }

    // Limitar velocidades
    this.ballSpeedX = Math.max(-this.maxSpeed, Math.min(this.maxSpeed, this.ballSpeedX));

    this.ballSpeedY = Math.max(-6, Math.min(6, this.ballSpeedY));

    // SCORE
    if (this.ballX < 0) {
      this.aiScore++;
      this.resetPositions();
    }

    if (this.ballX > this.canvasWidth) {
      this.playerScore++;
      this.resetPositions();
    }

    // TRAIL
    this.trail.push({ x: this.ballX, y: this.ballY });
    if (this.trail.length > this.maxTrail) this.trail.shift();
  }

  draw() {
    if (!this.ctx) return;

    const ctx = this.ctx;

    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#020617');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    ctx.strokeStyle = 'rgba(0, 234, 255, 0.2)';
    ctx.setLineDash([15, 10]);

    ctx.beginPath();
    ctx.moveTo(this.canvasWidth / 2, 0);
    ctx.lineTo(this.canvasWidth / 2, this.canvasHeight);
    ctx.stroke();

    ctx.setLineDash([]);

    this.trail.forEach((t, i) => {
      ctx.beginPath();
      ctx.arc(t.x, t.y, this.ballRadius * (i / this.trail.length), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249, 115, 22, ${i / (this.trail.length * 2)})`;
      ctx.fill();
    });

    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00eaff';
    ctx.fillStyle = '#00eaff';
    ctx.fillRect(this.playerX, this.playerY, this.paddleWidth, this.paddleHeight);

    ctx.shadowColor = '#ff00ff';
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(this.aiX, this.aiY, this.paddleWidth, this.paddleHeight);

    ctx.shadowBlur = 15;
    ctx.shadowColor = '#f97316';
    ctx.fillStyle = '#f97316';

    ctx.beginPath();
    ctx.arc(this.ballX, this.ballY, this.ballRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  @HostListener('window:keydown', ['$event'])
  keyDown(e: KeyboardEvent) {
    if (['ArrowUp', 'ArrowDown', 'w', 's'].includes(e.key)) e.preventDefault();

    if (e.key === 'ArrowUp' || e.key === 'w') this.upPressed = true;
    if (e.key === 'ArrowDown' || e.key === 's') this.downPressed = true;

    this.cdr.detectChanges();
  }

  @HostListener('window:keyup', ['$event'])
  keyUp(e: KeyboardEvent) {
    if (e.key === 'ArrowUp' || e.key === 'w') this.upPressed = false;
    if (e.key === 'ArrowDown' || e.key === 's') this.downPressed = false;

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }
}
