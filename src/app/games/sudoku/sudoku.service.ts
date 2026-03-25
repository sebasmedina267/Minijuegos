import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SudokuService {

  tablero: number[][] = [];

  constructor() {
    this.inicializarTablero();
  }

  inicializarTablero() {
    this.tablero = [
      [5,3,0, 0,7,0, 0,0,0],
      [6,0,0, 1,9,5, 0,0,0],
      [0,9,8, 0,0,0, 0,6,0],

      [8,0,0, 0,6,0, 0,0,3],
      [4,0,0, 8,0,3, 0,0,1],
      [7,0,0, 0,2,0, 0,0,6],

      [0,6,0, 0,0,0, 2,8,0],
      [0,0,0, 4,1,9, 0,0,5],
      [0,0,0, 0,8,0, 0,7,9]
    ];
  }

  esValido(tablero: number[][], fila: number, col: number, num: number): boolean {

    // fila
    for (let x = 0; x < 9; x++) {
      if (tablero[fila][x] === num) return false;
    }

    // columna
    for (let x = 0; x < 9; x++) {
      if (tablero[x][col] === num) return false;
    }

    // bloque 3x3
    let startRow = fila - fila % 3;
    let startCol = col - col % 3;

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (tablero[i + startRow][j + startCol] === num) return false;
      }
    }

    return true;
  }
}
