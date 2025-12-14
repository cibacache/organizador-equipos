import { Component, input } from '@angular/core';

@Component({
  selector: 'app-label',
  imports: [],
  templateUrl: './label.html',
  styleUrl: './label.css'
})
export class Label {
  text = input.required<string>();
  isCaptain = input.required<boolean>();
}