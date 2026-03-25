import { Component, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RouterOutlet, CommonModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class Home {
  hasChildRoute = false;

  games = [
    { name: 'Tres en Raya', icon: '❌⭕', path: '/tic-tac-toe', disabled: false, color: 'var(--primary)' },
    { name: 'Tetris', icon: '🧱', path: '/tetris', disabled: false, color: 'var(--secondary)' },
    { name: 'Snake', icon: '🐍', path: '/snake', disabled: false, color: 'var(--accent)' },
    { name: 'Pong', icon: '🏓', path: '/pong', disabled: false, color: 'var(--primary)' },
    { name: 'Sudoku', icon: '🧩', path: '/sudoku', disabled: false, color: 'var(--secondary)' },
    { name: '2048', icon: '🔢', path: '/2048', disabled: false, color: 'var(--accent)' },
    { name: 'Memory', icon: '🃏', path: '/memory', disabled: false, color: 'var(--primary)' },
    { name: 'Buscaminas', icon: '💣', path: '/minesweeper', disabled: false, color: 'var(--secondary)' },
  ];

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: NavigationEnd) => {
      // 🔥 Actualiza después del cambio de vista
      setTimeout(() => {
        this.hasChildRoute = e.urlAfterRedirects !== '/';
        this.cdr.detectChanges();
      });
    });
  }
}
