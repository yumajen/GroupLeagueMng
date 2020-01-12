import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { PlayersService } from '../players.service';
import { GroupsService } from '../groups.service';
import { Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';

@Component({
  selector: 'app-shuffle',
  templateUrl: './shuffle.component.html',
  styleUrls: ['./shuffle.component.css']
})
export class ShuffleComponent implements OnInit, OnDestroy {

  totalPlayers: number; // 合計参加人数
  groups: any[]; // グループ
  inputInformations: any[] // 入力されたプレイヤー情報(shuffleコンポーネント内での保持用)
  shuffleCount: number // シャッフル回数(手動の場合のみ)
  shuffleMethod: number // シャッフル方法(自動:0, 手動:1)
  autoShuffleMessage: string // 自動シャッフル時の完了メッセージ
  subscriptions: Subscription[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialogRef: MatDialogRef<ShuffleComponent>,
    private playersService: PlayersService,
    private groupsService: GroupsService,
    private router: Router,
  ) {
    this.groups = [];
    this.inputInformations = Array.from(this.data.inputInformations); // inputInformationsのDeep Copy
    this.shuffleCount = 0;
    this.shuffleMethod = 0;
    this.autoShuffleMessage = null;
  }

  ngOnInit() {
    this.totalPlayers = this.inputInformations.length;
    this.inputInformations;
  }

  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
  }

  createGroups(numbers: number): void {
    this.groups = [];
    // 空のグループ(numberOfPlayers=0)を生成する
    for (let i = 0; i < numbers; i++) {
      this.groups.push({ id: i + 1, name: `グループ${this.outputAlphabet(i)}`, numberOfPlayers: 0 })
    }

    this.setNumberOfPlayers();
  }

  outputAlphabet(i: number): string {
    let first = 'A'.charCodeAt(0);
    return String.fromCharCode(first + i);
  }

  setNumberOfPlayers(): void {
    let count = 0;
    // 空のグループに1人ずつ順番に席を設定していく
    // countがtotalPlayersになったら終了
    while (count < this.totalPlayers) {
      this.groups.forEach((group) => {
        if (count == this.totalPlayers) {
          return true;
        }
        group['numberOfPlayers']++;
        count++;
      });
    }
  }

  isGroupsCreated(): boolean {
    return this.groups.length > 0;
  }

  manualShuffle(): void {
    this.executeShuffle();
    this.shuffleCount++;
  }

  autoShuffle(): void {
    // ランダムで1〜10回シャッフルを実行する
    let count = Math.floor(Math.random() * 9) + 1;
    for (let i = 0; i < count; i++) {
      this.executeShuffle();
    }
    this.autoShuffleMessage = 'シャッフル完了';
  }

  executeShuffle(): void {
    let array = this.inputInformations;
    for (let i = array.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [array[i], array[rand]] = [array[rand], array[i]];
    }

    this.inputInformations = Array.from(array);
  }

  switchActivation(event: any): void {
    if (event.target.id == 'manual') {
      this.shuffleMethod = 0;
    } else if (event.target.id == 'auto') {
      this.shuffleMethod = 1;
    } else {
      this.shuffleMethod = 0;
    }
  }

  finishLeaguesSetting(): void {
    // プレイヤーとグループを紐づける
    this.allocatePlayersToGroups();
    // 各種情報をDBへ登録する
    this.registerPlayers();
    this.registerGroups();
    // ダイアログを閉じてリーグ表ページへ遷移する
    this.matDialogRef.close();
    this.router.navigate(['league']);
  }


  allocatePlayersToGroups(): void {
    let index = 0;
    // シャッフル処理終了後のプレイヤー情報配列の先頭から一人ずつグループと紐づけていく
    this.groups.forEach((group) => {
      [...Array(group.numberOfPlayers)].map(() => {
        this.inputInformations[index].groupId = group.id;
        index++;
      });
    });
  }

  registerPlayers(): void {
    this.subscriptions.push(
      forkJoin(this.playersService.executeRegisterPlayers(this.data.inputInformations))
        .subscribe(
          () => {
            this.playersService.isPlayersRegistered = true;
          })
    );
  }

  registerGroups(): void {
    this.subscriptions.push(
      forkJoin(this.groupsService.executeRegisterGroups(this.groups))
        .subscribe(() => { })
    );
  }

}
