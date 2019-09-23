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

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public matDialogRef: MatDialogRef<ShuffleComponent>,
    private playersService: PlayersService,
    private groupsService: GroupsService
  ) {
    this.groupLeagues = [];
  }

  ngOnInit() {
    this.totalPlayers = this.data.inputInformations.length;
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
}
