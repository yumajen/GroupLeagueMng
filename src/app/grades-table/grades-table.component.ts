import { Component, OnInit, Input } from '@angular/core';
import { Group } from '../group';
import { Player } from '../player';
import { Linkage } from '../linkage';
import { MatchInformation } from '../matchInformation';

@Component({
  selector: 'app-grades-table',
  templateUrl: './grades-table.component.html',
  styleUrls: ['./grades-table.component.css']
})
export class GradesTableComponent implements OnInit {

  @Input() group: Group;
  @Input() players: Player[];
  @Input() linkages: Linkage[];
  @Input() matchInformations: MatchInformation[] = [];

  dataSource: Player[] = [];
  displayedColumns: String[] = ['upDown', 'rank', 'name', 'points', 'gains', 'losts', 'difference'];

  constructor() { }

  ngOnInit() {
  }

  getPlayersOfEachGroups(): Player[] {
    let targetLinkages = [];
    let eachPlayers = [];

    targetLinkages = this.linkages.filter((linkage) => {
      if (linkage.groupId == this.group.id) {
        return linkage;
      };
    });

    targetLinkages.forEach((linkage) => {
      this.players.forEach((player) => {
        if (player.id == linkage['playerId']) {
          eachPlayers.push(player);
        }
      });
    });

    this.sortArray(eachPlayers, 'asc');

    return eachPlayers;
  }

  sortArray(array: any[], direction: string): void {
    array.sort(function (a, b) {
      let ida = a.rank;
      let idb = b.rank;
      if ((direction == 'asc' && ida < idb) || (direction == 'disc' && ida > idb)) {
        return -1;
      }
      if ((direction == 'asc' && ida > idb) || (direction == 'disc' && ida < idb)) {
        return 1;
      }
      return 0;
    });
  }

  isSuperiorOfFinalRound(isSuperior: boolean): boolean {
    // 各グループで既に終了した対戦数
    let numberOfMatches = this.matchInformations.filter((info) => {
      if (info.groupId == this.group.id && (info.winnerId || info.isDraw)) {
        return info;
      };
    }).length;

    // 各グループの人数
    let numberOfPlayers = this.getPlayersOfEachGroups().length;
    // 各グループの最大対戦数
    let maxMatches = (numberOfPlayers - 1) * numberOfPlayers / 2;

    return isSuperior && numberOfMatches == maxMatches;
  }

  getRankUpDownSymbol(upDown: number): string {
    switch (upDown) {
      case 1:
        return 'arrow_upward';
      case 0:
        return 'arrow_forward';
      case -1:
        return 'arrow_downward';
      case -999:
        return 'remove';
    }
  }
}
