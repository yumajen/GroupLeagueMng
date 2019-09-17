import { Component, OnInit } from '@angular/core';
import { Player } from '../player';


@Component({
  selector: 'app-regist-players',
  templateUrl: './regist-players.component.html',
  styleUrls: ['./regist-players.component.css']
})
export class RegistPlayersComponent implements OnInit {

  player: Player[] = Player.players;
  inputInfomations: any[]; // 入力されたプレイヤー情報（DB登録前）

  constructor() {
    this.inputInfomations = new Array(
      { id: 1, name: '', otherItems: {} }
    );
  }

  ngOnInit() {
  }

  getOtherItems(id: number): any {
    let index = Number(id) - 1;
    return Object.entries(this.inputInfomations[index].otherItems);
  }

  addInputForm(): void {
    let index = this.inputInfomations.length + 1
    let otherItems = {}

    // 追加項目分のフォームはindex=0のotherItemsのkeyを元に生成する 
    Object.keys(this.inputInfomations[0].otherItems).forEach((key) => {
      otherItems[key] = '';
    });

    this.inputInfomations.push(
      { id: index, name: '', otherItems: otherItems }
    );
  }

  addInputElement(id: number, key: string, value: any): void {
    let index = id - 1;
    if (key == 'name') {
      // keyがnameの場合はそのままvalueを格納する
      this.inputInfomations[index][key] = value;
    } else {
      // keyがotherItemsの場合は、さらに下層のkeyにvalueを格納する
      this.inputInfomations[index]['otherItems'][key] = value;
    }
  }

  addItem(additionalKey: string): void {
    this.inputInfomations.forEach((inputInfomation) => {
      inputInfomation['otherItems'][additionalKey] = '';
    });
  }
}
