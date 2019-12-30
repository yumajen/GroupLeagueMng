import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Group } from '../group';
import { MatchInformation } from '../matchInformation';
import { Linkage } from '../linkage';
import { Player } from '../player';
import { MatchesService } from '../matches.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-match-lists',
  templateUrl: './match-lists.component.html',
  styleUrls: ['./match-lists.component.css']
})
export class MatchListsComponent implements OnInit {

  @Input() group: Group;
  @Input() players: Player[];
  @Input() linkages: Linkage[];

  eachPlayers: Player[] = [];
  matchInformations: MatchInformation[] = [];
  numberOfMatches: number; // 各グループ1回戦当たりの対戦数
  shuffledPlayers: Player[] = []; // シャッフルされたプレイヤーの配列
  centerPlayer: Player; // Kirkmanの組分け法の円の中心に配置されるプレイヤー
  breakPlayerInfos: any[] = []; // 対戦一回休みのプレイヤー(グループ内人数が奇数人の場合)
  pushedButtons: any[] = []; // 各組合せ毎に押下された勝敗ボタン情報を格納する
  inputMatchInfors: any[] = []; // 対戦組合わせ毎のデータ登録用パラメータ
  matcheResults: any[] = []; // 対戦組合わせ毎の結果(データ更新用パラメータ)

  constructor(
    private matchesService: MatchesService,
  ) { }

  ngOnInit() {
    this.getPlayersOfEachGroups(this.group.id);
    this.getMatchInformations();
  }

  getPlayersOfEachGroups(groupId: number): void {
    let targetLinkages = [];

    targetLinkages = this.linkages.filter((linkage) => {
      if (linkage.groupId == groupId) {
        return linkage;
      };
    });

    targetLinkages.forEach((linkage) => {
      this.players.forEach((player) => {
        if (player.id == linkage['playerId']) {
          this.eachPlayers.push(player);
        }
      });
    });

    this.sortArray(this.eachPlayers, 'asc');
  }

  getMatchInformations(): void {
    this.matchesService.getMatcheInformations().subscribe(
      (matchInformations) => {
        this.matchInformations = matchInformations;
        if (this.matchInformations.length == 0) {
          this.executeLottery();
          this.registerMatcheInformation();
        }
      }
    );
  }

  // 各グループの人数に応じた回戦数を計算する
  getRoundNumber(): number[] {
    let count = this.eachPlayers.length;
    // 回戦数分の空要素を持った配列を返す
    let allRounds = count % 2 == 0 ? count - 1 : count;
    let rounds = [];
    for (let i = 1; i <= allRounds; i++) {
      rounds.push(i);
    }

    return rounds;
  }

  // 各グループに含まれる対戦情報を抽出
  getMatchInformationsOfEachGroups(roundNumber: number = null): MatchInformation[] {
    let eachMatchInfos = [];

    eachMatchInfos = this.matchInformations.filter((info) => {
      if (info.groupId == this.group.id) {
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

  // 各グループ内でシャッフルし対戦組合せを決める
  executeLottery() {
    let rounds = this.getRoundNumber();
    rounds.forEach((round) => {
      let matches = this.drawLotsCombination(round);
      this.setInputMatchInfors(this.group.id, round, matches);
    });
    this.matchesService.setRegisterParams(this.inputMatchInfors);
  }

  // 対戦組合わせ決めシャッフルの主処理
  drawLotsCombination(roundNumber: number): any[] {
    let matches = [];
    let dummyPlayer: Player = {
      id: 999,
      name: 'dummy',
      otherItems: {},
      gains: null,
      losts: null,
      points: null,
      rank: null,
      upDown: 0,
      isSuperior: false,
    };

    if (roundNumber == 1) {
      // グループ内人数が奇数の場合はダミープレイヤーを加えて偶数にする
      if (this.eachPlayers.length % 2 != 0) {
        this.eachPlayers.push(dummyPlayer);
      }
      this.numberOfMatches = this.eachPlayers.length / 2;
      // グループ内に含まれるプレイヤー情報をシャッフルして配列に格納する
      this.shuffledPlayers = this.executeShuffle(this.eachPlayers);
      this.centerPlayer = this.shuffledPlayers.shift();
    }

    let player1: Player = null;
    let player2: Player = null;

    player1 = this.centerPlayer;
    player2 = this.shuffledPlayers[0];
    if (this.isSameObject(player1, dummyPlayer) || this.isSameObject(player2, dummyPlayer)) {
      let breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
      this.setBreakPlayer(this.group.id, roundNumber, breakPlayer);
    } else {
      matches.push([player1, player2]);
    }

    for (let i = 1; i <= this.numberOfMatches - 1; i++) {
      player1 = this.shuffledPlayers[i];
      player2 = this.shuffledPlayers[this.eachPlayers.length - i - 1];
      if (this.isSameObject(player1, dummyPlayer) || this.isSameObject(player2, dummyPlayer)) {
        let breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
        this.setBreakPlayer(this.group.id, roundNumber, breakPlayer);
      } else {
        matches.push([player1, player2]);
      }
    }

    // shuffledPlayers配列の末尾の要素を先頭に付け替えることで要素をローテーションする
    let lastElement = this.shuffledPlayers.pop();
    this.shuffledPlayers.unshift(lastElement);

    return matches;
  }

  executeShuffle(players: Player[]): Player[] {
    let array = Array.from(players);
    for (let i = array.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [array[i], array[rand]] = [array[rand], array[i]];
    }

    return Array.from(array);
  }

  setInputMatchInfors(groupId: number, roundNumber: number, matches: any[]): void {
    matches.forEach((match) => {
      let inputMatchInfo = {
        id: 0,
        groupId: groupId,
        roundNumber: roundNumber,
        match: match,
        winnerId: null,
        isDraw: false,
        score1: null,
        score2: null
      };
      this.inputMatchInfors.push(inputMatchInfo);
    });
  }

  registerMatcheInformation(): void {
    forkJoin(this.matchesService.executeRegisterMatches())
      .subscribe(
        () => {
          this.getMatchInformations();
        }
      )
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

  isSameObject(obj1, obj2): boolean {
    return JSON.stringify(obj1) === JSON.stringify(obj2);
  }

  setBreakPlayer(groupId: number, roundNumber: number, breakPlayer: Player): void {
    this.breakPlayerInfos.push({
      groupId: groupId,
      roundNumber: roundNumber,
      breakPlayer: breakPlayer,
    });
  }

  isPushed(buttonIndex: number, matchInfoId: number): boolean {
    // TODO: タブ切り替えた時のボタン押下状態を復活させる処理が必要
    let target = this.pushedButtons.find((button) => {
      if (button.id == matchInfoId) {
        return button;
      }
    });

    return target && target.index == buttonIndex;
  }

  inputResult(matchInfo: MatchInformation, score1: number, score2: number, buttonIndex: number, match: Player[] = null): void {
    let winnerId: number;
    let isScoreFilled: boolean = !!score1 && !!score2;

    // 結果ボタンの押下なし、かつプレイヤー1, 2共に得点の入力がない場合は結果の登録を行わない
    if (buttonIndex == undefined && !isScoreFilled) {
      return;
    }

    // プレイヤー1, 2共に得点の入力がある場合にボタンを押下しても結果の登録を行わない
    if (buttonIndex && isScoreFilled) {
      return;
    }

    if (match) {
      winnerId = match[buttonIndex] ? match[buttonIndex].id : null;
    }

    // 得点が入力されている場合の処理
    if (isScoreFilled && match) {
      // 得点に応じたボタンの押下状態及び勝敗計算になる
      if (score1 > score2) {
        buttonIndex = 0; // player1が勝利
        winnerId = match[buttonIndex].id;
      } else if (score1 < score2) {
        buttonIndex = 1; // player2が勝利
        winnerId = match[buttonIndex].id;
      } else {
        buttonIndex = 2; // 引き分け
      }
    }

    this.changeButtonStatus(matchInfo.id, buttonIndex, isScoreFilled);
    this.setResult(matchInfo, score1, score2, isScoreFilled, winnerId);
  }

  changeButtonStatus(matchInfoId: number, buttonIndex: number, isScoreFilled: boolean): void {
    // 同じ対戦組合せ内ではボタンの押下状態は排他的にする
    let isSameButton = false;
    this.pushedButtons.some((button, i) => {
      if (button.id == matchInfoId) {
        this.pushedButtons.splice(i, 1);
        isSameButton = button.index == buttonIndex;
      }
    });
    // 既に押下状態のボタンを再度押下する場合はメソッドを抜ける(ただし得点の入力がある場合は抜けない)
    if (isSameButton && !isScoreFilled) {
      return;
    }

    this.pushedButtons.push(
      {
        id: matchInfoId,
        index: buttonIndex
      }
    )
    this.sortArray(this.pushedButtons, 'asc');
  }

  setResult(matchInfo: MatchInformation, score1: number, score2: number, isScoreFilled: boolean, playerId?: number): void {
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
    // 既に押下状態のボタンを再度押下する場合はメソッドを抜ける(ただし得点の入力がある場合は抜けない)
    if (isSameButton && !isScoreFilled) {
      return;
    }

    let updateInfo = {
      id: matchInfo.id,
      groupId: matchInfo.groupId,
      roundNumber: matchInfo.roundNumber,
      match: matchInfo.match,
      winnerId: winnerId,
      isDraw: isDraw,
      score1: score1 ? Number(score1) : null,
      score2: score2 ? Number(score2) : null
    }
    this.matcheResults.push(updateInfo);
    this.sortArray(this.matcheResults, 'asc');
    this.matchesService.setUpdateParams(this.matcheResults);
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

}
