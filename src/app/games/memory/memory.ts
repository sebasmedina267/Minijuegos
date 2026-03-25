import { Component, ChangeDetectorRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface Card {
  id: number;
  value: string;
  flipped: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-memory',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './memory.html',
  styleUrls: ['./memory.css'],
})
export class Memory implements OnInit {
  emojis = ['🍎','🍌','🍇','🍉','🍒','🥝','🍍','🍑']; // 8 pares
  cards: Card[] = [];
  selectedCards: Card[] = [];
  moves = 0;
  matches = 0;
  cdr = inject(ChangeDetectorRef);

  constructor() {}

  ngOnInit() {
    this.startGame();
  }

  startGame() {
    // Crear parejas
    const pairCards: Card[] = [];
    let id = 1;
    for (const emoji of this.emojis) {
      pairCards.push({ id: id++, value: emoji, flipped: false, matched: false });
      pairCards.push({ id: id++, value: emoji, flipped: false, matched: false });
    }

    // Mezclar cartas
    this.cards = pairCards.sort(() => Math.random() - 0.5);

    this.selectedCards = [];
    this.moves = 0;
    this.matches = 0;
    this.cdr.detectChanges();
  }

  flipCard(card: Card) {
    if (card.flipped || card.matched || this.selectedCards.length === 2) return;

    card.flipped = true;
    this.selectedCards.push(card);

    if (this.selectedCards.length === 2) {
      this.moves++;
      const [first, second] = this.selectedCards;
      if (first.value === second.value) {
        first.matched = true;
        second.matched = true;
        this.matches++;
        this.selectedCards = [];
      } else {
        setTimeout(() => {
          first.flipped = false;
          second.flipped = false;
          this.selectedCards = [];
          this.cdr.detectChanges();
        }, 800);
      }
    }
    this.cdr.detectChanges();
  }

  allMatched() {
    return this.matches === this.emojis.length;
  }
}
