import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Player } from '../player';
import { Group } from '../group';
import { Linkage } from '../linkage';
import { PlayersService } from '../players.service';
import { GroupsService } from '../groups.service';
import { MatchesService } from '../matches.service';
import { MatchInformation } from '../matchInformation';

const RESULT_SYMBOL = {
  WIN: '◯',
  LOSE: '×',
  DRAW: '△',
};

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.css']
})
export class LeagueComponent implements OnInit {

  players: Player[];
  groups: Group[];
  linkages: Linkage[];
  matchInformations: MatchInformation[];
  containedPlayers: Player[]; // 各グループに含まれているプレイヤーの配列
  shuffledPlayers: Player[]; // シャッフルされたプレイヤーの配列
  centerPlayer: Player; // Kirkmanの組分け法の円の中心に配置されるプレイヤー
  numberOfMatches: number; // 各グループ1回戦当たりの対戦数
  breakPlayerInfos: any[] = []; // 対戦一回休みのプレイヤー(グループ内人数が奇数人の場合)
  matchInfoIndex = 1; // 対戦情報登録用IDとして使うインデックス(要再考)
  matcheResults: any[] = []; // 対戦組合わせ毎の結果(データ更新用パラメータ)
  pushedButtons: any[] = []; // 各組合せ毎に押下された勝敗ボタン情報を格納する
  playersInfoForUpdate: any[] = []; // プレイヤー情報更新用の配列(勝ち点計算用)
  point: any; // 勝ち点のオブジェクト

  constructor(
    private playersService: PlayersService,
    private groupsService: GroupsService,
    private matchesService: MatchesService,
    public changeDetectorRef: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.getPlayers();
    this.getGroups();
  }

  getPlayers(): void {
    this.playersService.getPlayers().subscribe(
      (players) => {
        this.players = players;
      }
    );
  }

  getGroups(): void {
    this.groupsService.getGroups().subscribe(
      (groups) => {
        this.groups = groups;
        this.getLinkages();
      }
    );
  }

  getLinkages(): void {
    this.groupsService.getLinkages().subscribe(
      (linkages) => {
        this.linkages = linkages;
        this.executeLottery();
        this.getMatchInformations();
      }
    );
  }

  getMatchInformations(): void {
    this.matchesService.getMatcheInformations().subscribe(
      (matchInformations) => {
        this.matchInformations = matchInformations;
        this.calculatePoints();
      }
    );
  }

  updateMatchInformation(matchResult: any): void {
    this.matchesService.updateMatchInformation(matchResult as MatchInformation).subscribe(
      () => { }
    );
  }

  updatePlayer(updatePlayerInfo: any) {
    this.playersService.updatePlayer(updatePlayerInfo as Player).subscribe(
      () => { }
    );
  }

  getPlayersOfEachGroups(groupId: number): Player[] {
    let targetLinkages = [];
    let eachPlayers = [];

    targetLinkages = this.linkages.filter((linkage) => {
      if (linkage.groupId == groupId) {
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

    this.sortArrayAscendingOrder(eachPlayers);

    return eachPlayers;
  }

  getMatchInformationsOfEachGroups(groupId: number, roundNumber: number = null): MatchInformation[] {
    let eachMatchInfos = [];

    eachMatchInfos = this.matchInformations.filter((info) => {
      if (info.groupId == groupId) {
        return info;
      };
    });

    if (roundNumber) {
      eachMatchInfos = Array.from(
        eachMatchInfos.filter((info) => {
          if (info.roundNumber == roundNumber) {
            return info;
          };
        })
      );
    }

    return eachMatchInfos;
  }

  executeLottery() {
    this.groups.forEach((group) => {
      let rounds = this.getRoundNumber(group.id);
      rounds.forEach((round) => {
        let matches = this.drawLotsCombination(group.id, round);
        this.registMatcheInformation(group.id, round, matches);
      });
    });
  }

  getRoundNumber(groupId: number): number[] {
    // 各グループの人数に応じた回戦数を計算し、回戦数分の空要素を持った配列を返す
    let count = this.linkages.filter((linkage) => {
      return linkage.groupId == groupId;
    }).length;

    let allRounds = count % 2 == 0 ? count - 1 : count;
    let rounds = [];
    for (let i = 1; i <= allRounds; i++) {
      rounds.push(i);
    }

    return rounds;
  }

  drawLotsCombination(groupId: number, roundNumber: number): any[] {
    let matches = [];
    let dummyPlayer: Player = { id: 999, name: 'dummy', otherItems: {} };

    if (roundNumber == 1) {
      this.containedPlayers = this.getPlayersOfEachGroups(groupId);
      // グループ内人数が奇数の場合はダミープレイヤーを加えて偶数にする
      if (this.containedPlayers.length % 2 != 0) {
        this.containedPlayers.push(dummyPlayer);
      }
      this.numberOfMatches = this.containedPlayers.length / 2;
      // グループ内に含まれるプレイヤー情報をシャッフルして配列に格納する
      this.shuffledPlayers = this.executeShuffle(this.containedPlayers);
      this.centerPlayer = this.shuffledPlayers.shift();
    }

    let player1: Player = null;
    let player2: Player = null;

    player1 = this.centerPlayer;
    player2 = this.shuffledPlayers[0];
    if (this.isSameObject(player1, dummyPlayer) || this.isSameObject(player2, dummyPlayer)) {
      let breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
      this.setBreakPlayer(groupId, roundNumber, breakPlayer);
    } else {
      matches.push([player1, player2]);
    }

    for (let i = 1; i <= this.numberOfMatches - 1; i++) {
      player1 = this.shuffledPlayers[i];
      player2 = this.shuffledPlayers[this.containedPlayers.length - i - 1];
      if (this.isSameObject(player1, dummyPlayer) || this.isSameObject(player2, dummyPlayer)) {
        let breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
        this.setBreakPlayer(groupId, roundNumber, breakPlayer);
      } else {
        matches.push([player1, player2]);
      }
    }

    // shuffledPlayers配列の末尾の要素を先頭に付け替えることで要素をローテーションする
    let lastElement = this.shuffledPlayers.pop();
    this.shuffledPlayers.unshift(lastElement);

    return matches;
  }

  executeShuffle(containedPlayers: Player[]): Player[] {
    let array = Array.from(containedPlayers);
    for (let i = array.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [array[i], array[rand]] = [array[rand], array[i]];
    }

    return Array.from(array);
  }

  isSameObject(obj1, obj2): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  registMatcheInformation(groupId: number, roundNumber: number, matches: any[]): void {
    matches.forEach((match) => {
      let inputMatchInfo = {
        id: this.matchInfoIndex,
        groupId: groupId,
        roundNumber: roundNumber,
        match: match,
        winnerId: null,
        isDraw: false,
      };
      this.matchesService.registMatcheInformation(inputMatchInfo as MatchInformation)
        .subscribe(
          (matcheInformation) => {
            // 成功時の処理
          }
        );
      this.matchInfoIndex++;
    });
  }

  setBreakPlayer(groupId: number, roundNumber: number, breakPlayer: Player): void {
    this.breakPlayerInfos.push({
      groupId: groupId,
      roundNumber: roundNumber,
      breakPlayer: breakPlayer,
    });
  }

  getBreakPlayerMessage(groupId: number, roundNumber: number): string {
    let breakPlayer: Player

    this.breakPlayerInfos.filter((breakPlayerInfo) => {
      if (breakPlayerInfo.groupId == groupId && breakPlayerInfo.roundNumber == roundNumber) {
        breakPlayer = breakPlayerInfo.breakPlayer;
      }
    });

    let message = breakPlayer ? '対戦なし：' + breakPlayer.name : null;

    return message;
  }

  getMatchResultSymbol(groupId: number, playerId1: number, playerId2: number): string {
    // リーグ表の斜め罫線に該当する部分なので勝敗のマークは表示しない
    if (playerId1 == playerId2) {
      return;
    }

    let eachMatchInfos = this.getMatchInformationsOfEachGroups(groupId);
    let result = eachMatchInfos.find((info) => {
      let match = [info.match[0].id, info.match[1].id];
      if (match.indexOf(playerId1) != -1 && match.indexOf(playerId2) != -1) {
        return info;
      }
    });

    // 勝者IDが設定されておらず引き分けでもない場合(未対戦の場合)は勝敗のマークは表示しない
    if (!result.winnerId && !result.isDraw) {
      return;
    }

    let resultSymbol = result.isDraw ? RESULT_SYMBOL.DRAW : (playerId1 == result.winnerId ? RESULT_SYMBOL.WIN : RESULT_SYMBOL.LOSE)
    return resultSymbol;
  }

  buttonPushedProcessing(buttonIndex: number, matchInfo: MatchInformation, playerId?: number): void {
    this.changeButtonStatus(matchInfo.id, buttonIndex);
    this.setResult(matchInfo, playerId);
  }

  changeButtonStatus(matchInfoId: number, buttonIndex: number): void {
    // 同じ対戦組合せ内ではボタンの押下状態は排他的にする
    let isSameButton = false;
    this.pushedButtons.some((button, i) => {
      if (button.id == matchInfoId) {
        this.pushedButtons.splice(i, 1);
        isSameButton = button.index == buttonIndex;
      }
    });
    // 既に押下状態のボタンを再度押下する場合はメソッドを抜ける
    if (isSameButton) {
      return;
    }

    this.pushedButtons.push(
      {
        id: matchInfoId,
        index: buttonIndex
      }
    )
    this.sortArrayAscendingOrder(this.pushedButtons);
  }

  isPushed(buttonIndex: number, matchInfoId: number): boolean {
    let target = this.pushedButtons.find((button) => {
      if (button.id == matchInfoId) {
        return button;
      }
    });

    return target && target.index == buttonIndex;
  }

  setResult(matchInfo: MatchInformation, playerId?: number): void {
    let winnerId: number;
    let isDraw: boolean = false;

    isDraw = !playerId;
    if (!isDraw) {
      winnerId = playerId;
    }

    // 既に同じmatchInforIdのデータが格納されている場合は削除しデータの重複を避ける
    let isSameButton = false;
    this.matcheResults.some((result, i) => {
      if (result.id == matchInfo.id) {
        this.matcheResults.splice(i, 1);
        isSameButton = result.winnerId == playerId || isDraw;
      }
    });
    // 既に押下状態のボタンを再度押下する場合はメソッドを抜ける
    if (isSameButton) {
      return;
    }

    let updateInfo = {
      id: matchInfo.id,
      groupId: matchInfo.groupId,
      roundNumber: matchInfo.roundNumber,
      match: matchInfo.match,
      winnerId: winnerId,
      isDraw: isDraw
    }
    this.matcheResults.push(updateInfo);
    this.sortArrayAscendingOrder(this.matcheResults);
  }

  sortArrayAscendingOrder(array: any[]): void {
    array.sort(function (a, b) {
      let ida = a.id;
      let idb = b.id;
      if (ida < idb) {
        return -1;
      }
      if (ida > idb) {
        return 1;
      }
      return 0;
    });
  }

  updateLeagues(winPoint: number, drawPoint: number, losePoint: number): void {
    this.point = {
      win: winPoint,
      draw: drawPoint,
      lose: losePoint
    };

    this.matcheResults.forEach((result) => {
      this.updateMatchInformation(result);
    });

    this.getMatchInformations();
    this.matcheResults = [];
  }

  calculatePoints(): void {
    this.players.forEach((player) => {
      // 当該プレイヤーが関わる対戦のみを抽出
      let targetResults = this.matchInformations.filter((info) => {
        if (!info.winnerId && !info.isDraw) {
          return;
        }
        if (this.isSameObject(info.match[0].id, player.id) || this.isSameObject(info.match[1].id, player.id)) {
          return info;
        }
      });
      if (targetResults.length == 0) {
        return;
      }
      // 勝ち数のカウント
      let winCount = targetResults.filter((result) => {
        if (result.winnerId == player.id) {
          return result;
        }
      }).length;
      // 引き分け数のカウント
      let drawCount = targetResults.filter((result) => {
        if (result.isDraw) {
          return result;
        }
      }).length;
      // 負け数のカウント = 当該プレイヤーが関わる対戦数 - 勝ち数 - 引き分け数
      let loseCount = targetResults.length - winCount - drawCount;

      let updatePlayerInfo = JSON.parse(JSON.stringify(player));
      let points = winCount * this.point.win + drawCount * this.point.draw + loseCount * this.point.lose;
      updatePlayerInfo['points'] = points;

      this.updatePlayer(updatePlayerInfo);
    });

    this.getPlayers();
  }

}
