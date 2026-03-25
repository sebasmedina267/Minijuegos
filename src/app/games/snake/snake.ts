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
  cdr = inject(ChangeDetectorRef);

  tile = 20;
  boardSize = 600; // tablero más grande

  snake: Point[] = [];
  direction: Point = { x: this.tile, y: 0 };
  nextDirection: Point = this.direction;

  food: Point = { x: 0, y: 0 };

  gameOver = false;
  score = 0;
  started = false; // si el juego ha empezado
  paused = false;  // para pausa

  speed = 120;
  lastTime = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvas.nativeElement;
    canvas.width = this.boardSize;
    canvas.height = this.boardSize;

    this.ctx = canvas.getContext('2d')!;
    this.resetGame();
    this.draw();
  }

  loop = (time: number) => {
    if (this.gameOver || !this.started || this.paused) return;

    if (time - this.lastTime > this.speed) {
      this.update();
      this.draw();
      this.lastTime = time;
      this.cdr.detectChanges();
    }

    requestAnimationFrame(this.loop);
  };

  @HostListener('window:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if (!this.started || this.paused) return;

    const map: Record<string, Point> = {
      ArrowUp: { x: 0, y: -this.tile },
      ArrowDown: { x: 0, y: this.tile },
      ArrowLeft: { x: -this.tile, y: 0 },
      ArrowRight: { x: this.tile, y: 0 },
    };

    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.preventDefault();
    }

    if (!map[e.key]) return;

    const newDir = map[e.key];
    if (newDir.x === -this.direction.x && newDir.y === -this.direction.y) return;

    this.nextDirection = newDir;
  }

  update() {
    this.direction = this.nextDirection;

    const head: Point = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y,
    };

    // colisiones
    if (head.x < 0 || head.x >= this.boardSize || head.y < 0 || head.y >= this.boardSize) {
      this.endGame();
      return;
    }

    if (this.snake.some((p) => p.x === head.x && p.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score++;
      this.food = this.generateFood();
      this.speed = Math.max(60, this.speed - 3);
    } else {
      this.snake.pop();
    }
  }

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

  draw() {
    const ctx = this.ctx;

    // Fondo con gradiente profundo
    const bgGradient = ctx.createRadialGradient(
      this.boardSize / 2, this.boardSize / 2, 50,
      this.boardSize / 2, this.boardSize / 2, this.boardSize
    );
    bgGradient.addColorStop(0, '#1a1c2c');
    bgGradient.addColorStop(1, '#0a0b11');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, this.boardSize, this.boardSize);

    // Grid Neon Sutil
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

    // Snake
    this.snake.forEach((p, i) => {
      ctx.save();
      
      if (i === 0) {
        // Cabeza
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#22c55e';
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        const r = this.tile / 2;
        ctx.roundRect(p.x + 1, p.y + 1, this.tile - 2, this.tile - 2, 6);
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#fff';
        const eyeSize = 3;
        ctx.beginPath();
        ctx.arc(p.x + this.tile*0.3, p.y + this.tile*0.3, eyeSize, 0, Math.PI*2);
        ctx.arc(p.x + this.tile*0.7, p.y + this.tile*0.3, eyeSize, 0, Math.PI*2);
        ctx.fill();
      } else {
        // Cuerpo con gradiente
        const alpha = Math.max(0.3, 1 - (i / this.snake.length));
        ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
        ctx.shadowBlur = 5;
        ctx.shadowColor = 'rgba(34, 197, 94, 0.4)';
        ctx.beginPath();
        ctx.roundRect(p.x + 2, p.y + 2, this.tile - 4, this.tile - 4, 4);
        ctx.fill();
      }
      ctx.restore();
    });

    // Comida - Corazón Neon
    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#f43f5e';
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(this.food.x + this.tile / 2, this.food.y + this.tile / 2, this.tile / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Brillo extra en el centro
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.food.x + this.tile / 2, this.food.y + this.tile / 2, this.tile / 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

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

  endGame() {
    this.gameOver = true;
  }

  restart() {
    this.resetGame();
  }

  startGame() {
    if (this.started) return;
    this.started = true;
    this.paused = false;
    requestAnimationFrame(this.loop);
  }

  togglePause() {
    if (!this.started || this.gameOver) return;
    this.paused = !this.paused;
    this.draw();
    if (!this.paused) requestAnimationFrame(this.loop);
    this.cdr.detectChanges();
  }
}
