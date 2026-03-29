import { Injectable } from '@angular/core';
import { GameState } from '../models/game-state.model';
import { Tile } from '../models/tile.model';

export type Direction = 'up' | 'down' | 'left' | 'right';

@Injectable({ providedIn: 'root' })
export class Game2048Service {

  /**
   * Creates the initial state for a new game.
   * The board starts empty and the game is not marked as started yet.
   */
  createInitialState(size = 4): GameState {
    return {
      size,
      grid: this.createEmptyGrid(size),
      score: 0,
      gameOver: false,
      started: false,
      paused: false,
    };
  }

  /**
   * Builds an empty grid of the given size.
   * Each tile starts with value 0.
   */
  createEmptyGrid(size: number): Tile[][] {
    return Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ value: 0 }))
    );
  }

  /**
   * Resets the game state and places the first two tiles.
   * This is called when the player presses START or RESET.
   */
  start(state: GameState): GameState {
    let next = {
      ...state,
      grid: this.createEmptyGrid(state.size),
      score: 0,
      gameOver: false,
      paused: false,
      started: true,
    };

    next = this.addRandomTile(next);
    next = this.addRandomTile(next);
    return next;
  }

  /**
   * Applies a movement in the given direction.
   * Handles rotation logic, merging tiles, scoring, and checking for game over.
   */
  move(state: GameState, dir: Direction): GameState {
    if (!state.started || state.gameOver || state.paused) return state;

    let grid = this.cloneGrid(state.grid);
    grid = this.resetMergeFlags(grid);

    // Helper to rotate the grid so we can reuse the same merge logic.
    const rotate = (g: Tile[][], times: number): Tile[][] => {
      let result = g;
      for (let t = 0; t < times; t++) {
        result = result[0].map((_, i) => result.map((row) => row[i]).reverse());
      }
      return result;
    };

    // Rotate depending on the direction so we only implement "move left" logic.
    switch (dir) {
      case 'up': grid = rotate(grid, 1); break;
      case 'right': grid = rotate(grid, 2); break;
      case 'down': grid = rotate(grid, 3); break;
    }

    let moved = false;
    let scoreGain = 0;

    // Process each row independently.
    for (let row = 0; row < state.size; row++) {
      let line = grid[row].filter((tile) => tile.value !== 0);

      // Merge adjacent tiles with the same value.
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i].value === line[i + 1].value && !line[i].merged && !line[i + 1].merged) {
          line[i] = { ...line[i], value: line[i].value * 2, merged: true };
          scoreGain += line[i].value;
          line.splice(i + 1, 1);
        }
      }

      // Fill the rest of the row with empty tiles.
      while (line.length < state.size) line.push({ value: 0 });

      // Check if anything actually moved.
      moved = moved || !line.every((tile, i) => tile.value === grid[row][i].value);
      grid[row] = line;
    }

    // Rotate back to the original orientation.
    switch (dir) {
      case 'up': grid = rotate(grid, 3); break;
      case 'right': grid = rotate(grid, 2); break;
      case 'down': grid = rotate(grid, 1); break;
    }

    let next: GameState = {
      ...state,
      grid,
      score: state.score + scoreGain,
    };

    // Only add a new tile if something actually changed.
    if (moved) next = this.addRandomTile(next);

    // Check if the player has lost.
    next = { ...next, gameOver: this.isGameOver(next.grid) };
    return next;
  }

  /**
   * Toggles the pause state.
   * The game cannot be paused if it hasn't started or if it's already over.
   */
  togglePause(state: GameState): GameState {
    if (!state.started || state.gameOver) return state;
    return { ...state, paused: !state.paused };
  }

  /**
   * Creates a deep copy of the grid so we don't mutate the original state.
   */
  private cloneGrid(grid: Tile[][]): Tile[][] {
    return grid.map((row) => row.map((tile) => ({ ...tile })));
  }

  /**
   * Clears the "merged" flag on all tiles.
   * This ensures tiles only merge once per move.
   */
  private resetMergeFlags(grid: Tile[][]): Tile[][] {
    return grid.map((row) => row.map((tile) => ({ ...tile, merged: false })));
  }

  /**
   * Places a new tile (2 or 4) in a random empty position.
   */
  private addRandomTile(state: GameState): GameState {
    const empty: { x: number; y: number }[] = [];

    state.grid.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile.value === 0) empty.push({ x, y });
      })
    );

    if (empty.length === 0) return state;

    const { x, y } = empty[Math.floor(Math.random() * empty.length)];
    const grid = this.cloneGrid(state.grid);
    grid[y][x].value = Math.random() < 0.9 ? 2 : 4;

    return { ...state, grid };
  }

  /**
   * Checks if the game is over.
   * The game ends when there are no empty tiles and no possible merges.
   */
  private isGameOver(grid: Tile[][]): boolean {
    const size = grid.length;

    // If there's at least one empty tile, the game continues.
    const hasZero = grid.some((row) => row.some((tile) => tile.value === 0));
    if (hasZero) return false;

    // Check for possible merges horizontally or vertically.
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const tile = grid[y][x];
        if (
          (x < size - 1 && tile.value === grid[y][x + 1].value) ||
          (y < size - 1 && tile.value === grid[y + 1][x].value)
        ) {
          return false;
        }
      }
    }

    return true;
  }
}
