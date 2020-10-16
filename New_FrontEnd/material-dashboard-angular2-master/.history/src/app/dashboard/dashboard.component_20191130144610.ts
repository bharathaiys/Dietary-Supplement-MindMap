import { Component, OnInit } from '@angular/core';
import * as Chartist from 'chartist';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  value='';
  filteredItems;
  assignCopy(){
    this.filteredItems = Object.assign([], this.questions);
 }
 filterItem(value){
    if(!value){
        this.assignCopy();
    } // when nothing has typed
    this.filteredItems = Object.assign([], this.questions).filter(
       item => item.toLowerCase().indexOf(value.toLowerCase()) > -1
    )
 }
 
  questions = [
    {index: 0,
    question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
    {index: 1,
      question: "What kind of Dietary Supplement product is effective for my Disease X?",},
      {index: 2,
        question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
        {index: 3,
          question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
          {index: 4,
            question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
            {index: 5,
              question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
              {index: 6,
                question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},{index: 0,
                  question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
                  {index: 7,
                    question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
                    {index: 8,
                      question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
                      {index: 9,
                        question: "What is/are available product(s) containing Dietary Supplement ingredient X?"},
                        
    
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
  
  ngOnInit() {
    this.assignCopy();
  }
}
