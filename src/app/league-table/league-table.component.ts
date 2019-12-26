import { Component, OnInit, Input } from '@angular/core';
import { MatchesService } from '../matches.service';
import { MatchInformation } from '../matchInformation';
import { Group } from '../group';
import { Player } from '../player';
import { Linkage } from '../linkage';
import { PlayersService } from '../players.service';

const RESULT_SYMBOL = {
  WIN: '◯',
  LOSE: '×',
  DRAW: '△',
};

@Component({
  selector: 'app-league-table',
  templateUrl: './league-table.component.html',
  styleUrls: ['./league-table.component.css']
})
export class LeagueTableComponent implements OnInit {

  @Input() group: Group;
  @Input() players: Player[];
  @Input() linkages: Linkage[];
  @Input() matchInformations: MatchInformation[] = [];
  @Input() calSettings: any;

  constructor(
    private playersService: PlayersService,
    private matchesService: MatchesService,
  ) { }

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
      let ida = a.id;
      let idb = b.id;
      if ((direction == 'asc' && ida < idb) || (direction == 'disc' && ida > idb)) {
        return -1;
      }
      if ((direction == 'asc' && ida > idb) || (direction == 'disc' && ida < idb)) {
        return 1;
      }
      return 0;
    });
  }

  getMatchInformationsOfEachGroups(): MatchInformation[] {
    let eachMatchInfos = [];

    eachMatchInfos = this.matchInformations.filter((info) => {
      if (info.groupId == this.group.id) {
        return info;
      };
    });

    return eachMatchInfos;
  }

  isSameObject(obj1, obj2): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
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

  updatePlayer(updatePlayerInfo: any) {
    this.playersService.updatePlayer(updatePlayerInfo as Player).subscribe(
      () => { }
    );
  }

  getMatchResultSymbol(playerId1: number, playerId2: number): string {
    // リーグ表の斜め罫線に該当する部分なので勝敗のマークは表示しない
    if (playerId1 == playerId2) {
      return;
    }

    if (this.matchInformations.length == 0) {
      return;
    }

    let eachMatchInfos = this.getMatchInformationsOfEachGroups();
    let result = eachMatchInfos.find((info) => {
      let match = [info.match[0].id, info.match[1].id];
      if (match.indexOf(playerId1) != -1 && match.indexOf(playerId2) != -1) {
        return info;
      }
    });
    if (!result) {
      return;
    }

    // 勝者IDが設定されておらず引き分けでもない場合(未対戦の場合)は勝敗のマークは表示しない
    if (!result.winnerId && !result.isDraw) {
      return;
    }

    let resultSymbol = result.isDraw ? RESULT_SYMBOL.DRAW : (playerId1 == result.winnerId ? RESULT_SYMBOL.WIN : RESULT_SYMBOL.LOSE)
    return resultSymbol;
  }

}
