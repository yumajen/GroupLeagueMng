import { Component, OnInit } from '@angular/core';
import { PlayersService } from '../players.service';
import { MatDialog } from '@angular/material';
import { ShuffleComponent } from '../shuffle/shuffle.component';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-regist-players',
  templateUrl: './regist-players.component.html',
  styleUrls: ['./regist-players.component.css']
})
export class RegistPlayersComponent implements OnInit {

  inputInformations: any[]; // 入力されたプレイヤー情報（DB登録前）
  checkedInformations: number[]; // チェックボックスが有効となっているプレイヤー情報 
  otherItemLabels: string[] = []; // 任意追加項目名
  isPlayersRegistered = false; // プレイヤーを登録済みかどうか判定
  subscriptions: Subscription[] = [];

  constructor(
    public matDialog: MatDialog,
    private playersService: PlayersService
  ) {
    this.inputInformations = new Array(
      {
        id: 1,
        name: '',
        otherItems: {},
        groupId: null,
        gains: null,
        losts: null,
        points: null,
        rank: 1,
        upDown: 0,
        isSuperior: false,
        isAbstained: false,
      }
    );
    this.checkedInformations = [];
  }

  ngOnInit() {
    this.isPlayersRegistered = this.playersService.isPlayersRegistered;
    if (this.isPlayersRegistered) {
      this.otherItemLabels = this.playersService.otherItemLabels;
      this.getPlayers();
    }
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
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
      {
        id: index,
        name: '',
        otherItems: otherItems,
        groupId: null,
        gains: null,
        losts: null,
        points: null,
        rank: 1,
        upDown: 0,
        isSuperior: false,
        isAbstained: false,
      }
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
    this.playersService.storeOtherItemLabels(this.otherItemLabels);
  }

  getPlayers(): void {
    this.subscriptions.push(
      this.playersService.getPlayers().subscribe(
        (players) => {
          this.inputInformations = players;
        }
      )
    );
  }

  switchCheckedTaeget(inputInformation: any): void {
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

  openShuffleDialog(): void {
    let shuffleDialog = this.matDialog.open(ShuffleComponent, {
      data: { 'inputInformations': this.inputInformations },
      width: '50vw',
      height: '90vh',
      disableClose: true
    });
  }

  updatePlayer() {
    this.subscriptions.push(
      forkJoin(this.playersService.executeUpdatePlayers(this.inputInformations))
        .subscribe(
          () => { }
        )
    );
  }

  abstainPlayers() {
    this.inputInformations.forEach((inputInformation) => {
      if (this.checkedInformations.indexOf(inputInformation) != -1) {
        inputInformation.isAbstained = true;
        this.playersService.setPlayerAbstainedGroups(inputInformation.groupId);
      };
    });

    const abstainedPlayers = this.inputInformations.filter((inputInformation) => {
      return inputInformation.isAbstained;
    })
    if (abstainedPlayers.length > 0) {
      this.playersService.isExecuteAbstention = true;
    }

    this.updatePlayer();
  }

}
