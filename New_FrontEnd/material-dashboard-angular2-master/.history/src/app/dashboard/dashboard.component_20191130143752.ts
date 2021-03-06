import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  value;
  assignCopy(){
    this.filteredItems = Object.assign([], this.items);
 }
 filterItem(value){
    if(!value){
        this.assignCopy();
    } // when nothing has typed
    this.filteredItems = Object.assign([], this.items).filter(
       item => item.name.toLowerCase().indexOf(value.toLowerCase()) > -1
    )
 }
 this.assignCopy();//when you fetch collection from server.
  questions = [
    "What is/are available product(s) containing Dietary Supplement ingredient X?",
    "What kind of Dietary Supplement product is effective for my Disease X?",
    "What kind of Dietary Supplement ingredient is effective for my Disease X?",
    "What is the background/origin of Dietary Supplement ingredient X?",
    "What are the common uses of Dietary Supplement ingredient X?",
    "What is/are the common adverse reaction(s) associated with Dietary Supplement ingredient X?",
    "With what medications does Dietary Supplement ingredient X could interact with?",
    "What ingredients does Dietary Supplement product X contain?",
    "What drug does Dietary Supplement product X interact with?",
    "What diseases is Dietary Supplement product X effective for?"
  ]

  constructor() { }
  
  ngOnInit() {}
}
