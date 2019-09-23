import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { PlayersService } from '../players.service';
import { GroupsService } from '../groups.service';

@Component({
  selector: 'app-shuffle',
  templateUrl: './shuffle.component.html',
  styleUrls: ['./shuffle.component.css']
})
export class ShuffleComponent implements OnInit {

  totalPlayers: number; // 合計参加人数
  groupLeagues: any[]; // グループリーグ
  inputInformations: any[] // 入力されたプレイヤー情報(shuffleコンポーネント内での保持用)
  shuffleCount: number // シャッフル回数(手動の場合のみ)

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialogRef: MatDialogRef<ShuffleComponent>,
    private playersService: PlayersService,
    private groupsService: GroupsService
  ) {
    this.groupLeagues = [];
    this.inputInformations = Array.from(this.data.inputInformations); // inputInformationsのDeep Copy
    this.shuffleCount = 0;
  }

  ngOnInit() {
    this.totalPlayers = this.inputInformations.length;
    this.inputInformations;
  }

  createGroups(numbers: number): void {
    this.groupLeagues = [];
    // 空のグループ(numberOfPlayers=0)を生成する
    for (let i = 0; i < numbers; i++) {
      this.groupLeagues.push({ id: i + 1, name: `グループ${this.outputAlphabet(i)}`, numberOfPlayers: 0 })
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
      this.groupLeagues.forEach((groupLeague) => {
        if (count == this.totalPlayers) {
          return true;
        }
        groupLeague['numberOfPlayers']++;
        count++;
      });
    }
  }

  isGroupsCreated(): boolean {
    return this.groupLeagues.length > 0;
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
  }

  executeShuffle(): void {
    let array = this.inputInformations;
    for (let i = array.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [array[i], array[rand]] = [array[rand], array[i]];
    }

    this.inputInformations = Array.from(array);
  }
}
