import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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

  // 勝ち点、順位計算条件設定用のフォーム(数値は初期値)
  calSettingForm = this.fb.group({
    win: [3],
    draw: [1],
    lose: [0],
    isConsiderDifference: [true],
    isConsiderTotalGains: [true],
    isConsiderDirectMatch: [true],
  });

  scoreForm = this.fb.group({
    score1: [''],
    score2: [''],
  });

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
    private fb: FormBuilder,
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
        this.calculateGrades();
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

    this.sortArray(eachPlayers, 'asc');

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
    let dummyPlayer: Player = {
      id: 999,
      name: 'dummy',
      otherItems: {},
      gains: null,
      losts: null,
      points: null,
      rank: null
    };

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
        score1: null,
        score2: null
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

  isPushed(buttonIndex: number, matchInfoId: number): boolean {
    let target = this.pushedButtons.find((button) => {
      if (button.id == matchInfoId) {
        return button;
      }
    });

    return target && target.index == buttonIndex;
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

  updateLeagues(): void {
    this.matcheResults.forEach((result) => {
      this.updateMatchInformation(result);
    });

    this.getMatchInformations();
    this.matcheResults = [];
  }

  calculateGrades(): void {
    let updatePlayerInfo: any[] = []; // プレイヤー情報更新用パラメータ配列

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

      // 勝ち点、得失点を計算し、プレイヤー情報更新用パラメータを作成する
      let points = this.calculatePoints(player, targetResults);
      let score = this.calculateScore(player, targetResults);
      let playerInfo = JSON.parse(JSON.stringify(player));
      playerInfo['gains'] = score.gains;
      playerInfo['losts'] = score.losts;
      playerInfo['points'] = points;

      updatePlayerInfo.push(playerInfo)
    });

    // 順位を計算し、プレイヤー情報更新用パラメータを更新する
    this.calculateRank(updatePlayerInfo)

    // 上記で設定したパラメータでプレイヤー情報を更新
    updatePlayerInfo.forEach((playerInfo) => {
      this.updatePlayer(playerInfo);
    });

    this.getPlayers();
  }

  calculatePoints(player: Player, targetResults: MatchInformation[]): number {
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

    let winPoint = Number(this.calSettingForm.value.win);
    let drawPoint = Number(this.calSettingForm.value.draw);
    let losePoint = Number(this.calSettingForm.value.lose);
    return winCount * winPoint + drawCount * drawPoint + loseCount * losePoint;
  }

  calculateScore(player: Player, targetResults: MatchInformation[]): any {
    let totalGains: number = 0;
    let totalLosts: number = 0;

    targetResults.forEach((result) => {
      // 得点が未入力の場合は加算しない
      if (result.score1 == undefined || result.score2 == undefined) {
        return;
      }
      let gains = result.match[0].id == player.id ? result.score1 : result.score2;
      let losts = result.match[0].id == player.id ? result.score2 : result.score1;
      totalGains += gains;
      totalLosts += losts;
    });
    return { gains: totalGains, losts: totalLosts };
  }

  calculateRank(updatePlayerInfo: any[]): void {
    // 順位計算条件の設定(勝ち点の考慮は必ず)
    let compareProperties = this.getCompareProperties();

    // グループ毎に順位を計算し、プレイヤー情報更新用パラメータに追加
    this.groups.forEach((group) => {
      let eachPlayers = this.getPlayersOfEachGroups(group.id);
      // グループに含まれるプレイヤー情報の更新パラメータを抽出
      let containedPlayerInfo = updatePlayerInfo.filter((playerInfo) => {
        let targetPlayerInfo = eachPlayers.find((player) => {
          if (player.id == playerInfo.id) {
            return playerInfo;
          }
        });
        return targetPlayerInfo;
      });
      this.resetRank(containedPlayerInfo);

      // 各比較要素毎に以下の順位決定処理を繰り返す
      compareProperties.forEach((compareProperty) => {
        // 順位を格納した配列を作成
        let ranks = containedPlayerInfo.map((playerInfo) => {
          return playerInfo.rank;
        });
        // ranksの重複を削除
        let uniqueRanks = ranks.filter((rank, i, self) => {
          return self.indexOf(rank) == i;
        });
        // uniqueRanksを昇順に並べ変える
        uniqueRanks = uniqueRanks.sort((a, b) => {
          return a - b;
        });

        uniqueRanks.forEach((duplicateRank) => {
          // 順位が同じプレイヤー更新パラメータを抽出
          let sameRankPlayerInfos = containedPlayerInfo.filter((player) => {
            return player.rank == duplicateRank;
          });
          // 比較要素の値の大小に応じて順位づけする
          // 比較値を格納した配列を作成
          let compareValues = sameRankPlayerInfos.map((info) => {
            return compareProperty.comp(info);
          });
          // 比較値配列の重複を削除
          let uniqueCompareValues = compareValues.filter((d, i, self) => {
            return self.indexOf(d) == i;
          });
          // 比較値の降順に並べ変える
          uniqueCompareValues = uniqueCompareValues.sort((a, b) => {
            return b - a;
          });
          // 比較値が同じプレイヤーには同じ順位を設定していく
          uniqueCompareValues.forEach((compareValue) => {
            let sameValuePlayerInfos = sameRankPlayerInfos.filter((playerInfo) => {
              return compareProperty.comp(playerInfo) == compareValue;
            });
            sameValuePlayerInfos.forEach((playerInfo) => {
              playerInfo['rank'] = duplicateRank;
            });
            duplicateRank += sameValuePlayerInfos.length;
          });
        });
      });

      // 同順位が存在する場合、直接対決の結果を考慮する
      if (!this.calSettingForm.value.isConsiderDirectMatch) {
        return;
      }
      let ranks = containedPlayerInfo.map((playerInfo) => {
        return playerInfo.rank;
      });
      // 複数のプレイヤーが該当する順位のみ抽出
      let duplicateRanks = ranks.filter((rank, i, self) => {
        return self.indexOf(rank) !== self.lastIndexOf(rank);
      });

      duplicateRanks.forEach((rank) => {
        // 順位が同じプレイヤーを抽出
        let sameRankPlayers = containedPlayerInfo.filter((player) => {
          return player.rank == rank;
        });

        let additionalRankInfos = sameRankPlayers.map((player) => {
          return { player: player, additionalRank: 0 };
        });

        let matchInformationsCopy = Array.from(this.matchInformations);
        additionalRankInfos.forEach((rankInfo1) => {
          let player1Id = rankInfo1.player.id;
          additionalRankInfos.forEach((rankInfo2) => {
            let player2Id = rankInfo2.player.id
            if (player1Id == player2Id) {
              return;
            }
            let targetMatch = matchInformationsCopy.find((matchInfo, i) => {
              if (matchInfo.match[0].id == player1Id && matchInfo.match[1].id == player2Id ||
                matchInfo.match[0].id == player2Id && matchInfo.match[1].id == player1Id) {
                matchInformationsCopy.splice(i, 1);
                return matchInfo;
              }
            });

            if (!targetMatch) {
              return;
            }
            if (targetMatch.winnerId == player1Id) {
              rankInfo2.additionalRank += 1;
            } else if (targetMatch.winnerId == player2Id) {
              rankInfo1.additionalRank += 1
            }
          });
        });

        additionalRankInfos.forEach((rankInfo) => {
          rankInfo.player.rank += rankInfo.additionalRank;
        });
      });
    });
  }

  getCompareProperties(): any[] {
    let compareProperties = [];

    // 勝ち点を考慮(必ず実施される)
    compareProperties.push({ comp: p => p.points });

    // 得失点差を考慮
    if (this.calSettingForm.value.isConsiderDifference) {
      compareProperties.push({ comp: p => p.gains - p.losts });
    }

    // 総得点数を考慮
    if (this.calSettingForm.value.isConsiderTotalGains) {
      compareProperties.push({ comp: p => p.gains });
    }

    return compareProperties;
  }

  resetRank(playerInfos: any[]): void {
    // 順位計算の前にグループ内全プレイヤーの順位をリセットする
    playerInfos.forEach((playerInfo) => {
      playerInfo.rank = 1;
    });
  }
}
