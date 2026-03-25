import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { SudokuService } from './sudoku.service';

import { CommonModule } from '@angular/common';
import { R3ClassDebugInfo } from '@angular/compiler';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-sudoku',
  imports: [CommonModule, RouterLink],
  standalone: true,
  templateUrl: './sudoku.html',
  styleUrls: ['./sudoku.css']
})
export class SudokuComponent {

  tablero: number[][] = [];
  mensaje: string = '';
  error: boolean = false;
  cdr = inject(ChangeDetectorRef);

  constructor(public sudokuService: SudokuService) {
    this.tablero = JSON.parse(JSON.stringify(this.sudokuService.tablero));
  }

  actualizarCelda(event: any, fila: number, col: number) {
    let valor = parseInt(event.target.value);
    this.mensaje = '';
    this.error = false;

    if (!valor) {
      this.tablero[fila][col] = 0;
      this.cdr.detectChanges();
      return;
    }

    if (valor >= 1 && valor <= 9) {
      if (this.sudokuService.esValido(this.tablero, fila, col, valor)) {
        this.tablero[fila][col] = valor;
        this.mensaje = '✅ ¡Buen movimiento!';
      } else {
        this.error = true;
        this.mensaje = '❌ El número no es válido aquí';
        event.target.value = '';
      }
    } else {
      event.target.value = '';
    }
    this.cdr.detectChanges();
  }
}
