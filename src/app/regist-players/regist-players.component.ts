import { Component, OnInit } from '@angular/core';
import { Player } from '../player';
import { PlayersService } from '../players.service';


@Component({
  selector: 'app-regist-players',
  templateUrl: './regist-players.component.html',
  styleUrls: ['./regist-players.component.css']
})
export class RegistPlayersComponent implements OnInit {

  player: Player[] = Player.players;
  inputInformations: any[]; // 入力されたプレイヤー情報（DB登録前）
  checkedInformations: number[]; // チェックボックスが有効となっているプレイヤー情報 
  otherItemLabels: string[]; // 任意追加項目名

  constructor(
    private playersService: PlayersService
  ) {
    this.inputInformations = new Array(
      { id: 1, name: '', otherItems: {} }
    );
    this.checkedInformations = [];
    this.otherItemLabels = [];
  }

  ngOnInit() {
    this.getPlayers();
  }

  getOtherItems(id: number): any {
    let index = Number(id) - 1;
    return Object.entries(this.inputInformations[index].otherItems);
  }

  addInputForm(): void {
    let index = this.inputInformations.length + 1
    let otherItems = {}

    // 追加項目分のフォームはotherItemLabels配列の要素を元に生成する 
    this.otherItemLabels.forEach((key) => {
      otherItems[key] = '';
    });

    this.inputInformations.push(
      { id: index, name: '', otherItems: otherItems }
    );
  }

  addInputElement(id: number, key: string, value: any): void {
    let index = id - 1;
    if (key == 'name') {
      // keyがnameの場合はそのままvalueを格納する
      this.inputInformations[index][key] = value;
    } else {
      // keyがotherItemsの場合は、さらに下層のkeyにvalueを格納する
      this.inputInformations[index]['otherItems'][key] = value;
    }
  }

  addItem(additionalKey: string): void {
    this.inputInformations.forEach((inputInfomation) => {
      inputInfomation['otherItems'][additionalKey] = '';
    });

    this.otherItemLabels.push(additionalKey);
  }

  getPlayers(): void {
    this.playersService.getPlayers().subscribe(
      (players) => {
        console.log(players);
      }
    );
  }

  registPlayers(): void {
    this.inputInformations.forEach((inputPlayer) => {
      this.playersService.registPlayer(inputPlayer as Player)
        .subscribe(
          (player) => {
            // 成功時の処理
            console.log(player);
          }
        );
    });
  }

  switchDeleteTaeget(inputInformation: any): void {
    if (this.checkedInformations.includes(inputInformation)) {
      this.checkedInformations.splice(this.checkedInformations.indexOf(inputInformation), 1)
    } else {
      this.checkedInformations.push(inputInformation);
    }
  }

  deleteInputInformations(): void {
    this.inputInformations = this.inputInformations.filter((inputInformation) => {
      return this.checkedInformations.indexOf(inputInformation) == -1;
    });

    this.reNumberingToInputInformations();
  }

  reNumberingToInputInformations(): void {
    this.inputInformations.forEach((inputInformation, index) => {
      inputInformation['id'] = index + 1;
    });
  }

  deleteAdditionalColumn(key: string, index: number): void {
    // 任意追加項目配列から対象の項目名を削除
    this.otherItemLabels.splice(index, 1);
    // プレイヤー入力情報から対象項目の値を削除
    this.inputInformations.forEach((inputInformation) => {
      delete inputInformation['otherItems'][key];
    });
  }

}
