import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  questions = [
    "What is/are available product(s) containing Dietary Supplement ingredient X?",
    "What kind of Dietary Supplement product is effective for my Disease X?",
    "What kind of dietary supplement ingredient is effective for my Disease X?",
    ""
  ]

  constructor() { }
  
  ngOnInit() {}
}
