import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Player } from '../player';
import { Group } from '../group';
import { PlayersService } from '../players.service';
import { GroupsService } from '../groups.service';
import { MatchesService } from '../matches.service';
import { MatchInformation } from '../matchInformation';
import { forkJoin, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.css']
})
export class LeagueComponent implements OnInit, OnDestroy {

  // 勝ち点、順位計算条件設定用のフォーム(数値は初期値)
  calSettingForm = this.fb.group({
    win: [3],
    draw: [1],
    lose: [0],
    isConsiderDifference: [true],
    isConsiderTotalGains: [true],
    isConsiderDirectMatch: [true],
    winnerRanks: [1],
  });

  players: Player[];
  groups: Group[];
  matchInformations: MatchInformation[];
  matchInformations$: Observable<MatchInformation[]>;
  subscription: Subscription;
  matcheResults: any[] = []; // 対戦組合わせ毎の結果(データ更新用パラメータ)
  isLeaguesUpdated = false;  // 更新ボタンが押されたかどうかを判定し、成績計算実行の有無を分ける
  isCalSettingChanged = false; // 勝ち点、順位計算条件が変更されたかどうかを判定する

  constructor(
    private playersService: PlayersService,
    private groupsService: GroupsService,
    private matchesService: MatchesService,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
    this.calSettingForm.valueChanges.subscribe(v => {
      this.isCalSettingChanged = true;
    });
    this.getPlayers();
    this.getGroups();
    // 初期の画面描画時に1回対戦情報を取得する
    this.initialGetMatchInformations();

    // 対戦情報が更新される度に対戦情報を取得し直す
    this.matchInformations$ = this.matchesService.dataChanged;
    this.subscription = this.matchInformations$.subscribe(info$ => {
      this.isLeaguesUpdated = true;
      this.matchInformations = info$;
      this.afterUpdateProcessing();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
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
      }
    );
  }

  afterUpdateProcessing(): void {
    if (this.isLeaguesUpdated || this.playersService.isExecuteAbstention) {
      this.calculateGrades();
      this.isLeaguesUpdated = false;
      this.matchesService.clearMatchUpdatedGroups();
    }
  }

  initialGetMatchInformations(): void {
    this.matchesService.getMatcheInformations().subscribe(
      (matchInformations) => {
        this.matchInformations = matchInformations;
        this.afterUpdateProcessing();
      }
    );
  }

  updatePlayer(updatePlayerInfo: any) {
    forkJoin(this.playersService.executeUpdatePlayers(updatePlayerInfo))
      .subscribe(
        () => { }
      );
  }

  getPlayersOfEachGroups(groupId: number): Player[] {
    let eachPlayers = this.players.filter((player) => {
      return player.groupId == groupId;
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
    if (this.matchesService.isUpdatePraramsSet) {
      forkJoin(this.matchesService.executeUpdateMatches())
        .subscribe(
          () => {
            this.matchesService.sendMatcheInformations();
          }
        )
    } else if (this.isCalSettingChanged) {
      // 計算条件を変更しただけでは対戦情報の変更がないため、別途成績計算実行関数を呼び出す必要がある
      this.groups.forEach(group => this.matchesService.setMatchUpdatedGroups(group.id));
      this.isCalSettingChanged = false;
      this.isLeaguesUpdated = true;
      this.afterUpdateProcessing();
    }
  }

  calculateGrades(): void {
    let updatePlayerInfo: any[] = []; // プレイヤー情報更新用パラメータ配列

    // 対戦情報に変更があったグループのみを成績計算の対象にする
    const targetGroupIds = this.playersService.isExecuteAbstention
      ? this.playersService.playerAbstainedGroups
      : this.matchesService.matchUpdatedGroups;

    targetGroupIds.forEach((groupId) => {
      const eachPlayers = this.getPlayersOfEachGroups(groupId);

      eachPlayers.forEach((player) => {
        // 棄権したプレイヤーの成績は計算しない(元のプレイヤー情報をそのままupdatePlayerInfoに追加)
        if (player.isAbstained) {
          updatePlayerInfo.push(JSON.parse(JSON.stringify(player)));
          return;
        }

        // 当該プレイヤーが関わる対戦のみを抽出
        let targetResults = this.matchInformations.filter((info) => {
          if (!info.winnerId && !info.isDraw) {
            return;
          }
          if (info.match[0] == player.id || info.match[1] == player.id) {
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

        updatePlayerInfo.push(playerInfo);
      });

    });
    // 順位を計算し、プレイヤー情報更新用パラメータを更新する
    this.calculateRank(updatePlayerInfo, targetGroupIds);

    // 各プレイヤーの順位変動を判定する
    this.setRankUpDown(updatePlayerInfo);

    // 各プレイヤーについて、現在の順位で優勝または次ステージへ進出可能かどうかを判定する
    this.decideSuperior(updatePlayerInfo);

    // 上記で設定したパラメータでプレイヤー情報を更新
    this.updatePlayer(updatePlayerInfo);

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
      let gains = result.match[0] == player.id ? result.score1 : result.score2;
      let losts = result.match[0] == player.id ? result.score2 : result.score1;
      totalGains += gains;
      totalLosts += losts;
    });
    return { gains: totalGains, losts: totalLosts };
  }

  calculateRank(updatePlayerInfo: any[], targetGroupIds: number[]): void {
    // 順位計算条件の設定(勝ち点の考慮は必ず)
    let compareProperties = this.getCompareProperties();

    // 対戦情報に変更があったグループ毎に順位を計算し、プレイヤー情報更新用パラメータに追加
    targetGroupIds.forEach((groupId) => {
      let eachPlayers = this.getPlayersOfEachGroups(groupId);

      // 棄権したプレイヤーの順位を最下位にする
      updatePlayerInfo.forEach((playerInfo) => {
        if (playerInfo.isAbstained) {
          playerInfo.rank = eachPlayers.length;
        }
      });

      // グループに含まれる(棄権以外)プレイヤー情報の更新パラメータを抽出
      let containedPlayerInfo = updatePlayerInfo.filter((playerInfo) => {
        let targetPlayerInfo = eachPlayers.find((player) => {
          if (player.id == playerInfo.id && !playerInfo.isAbstained) {
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
              if (matchInfo.match[0] == player1Id && matchInfo.match[1] == player2Id ||
                matchInfo.match[0] == player2Id && matchInfo.match[1] == player1Id) {
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

  setRankUpDown(updatePlayerInfo: any[]): void {
    updatePlayerInfo.forEach((afterPlayer) => {
      if (afterPlayer.isAbstained) {
        afterPlayer.upDown = -999;
      } else {
        const beforePlayer = this.players.find((player) => {
          return player.id == afterPlayer.id;
        });
        const rankDifference = beforePlayer.rank - afterPlayer.rank;

        if (rankDifference > 0) {
          afterPlayer.upDown = 1;
        } else if (rankDifference < 0) {
          afterPlayer.upDown = -1;
        } else {
          afterPlayer.upDown = 0;
        }
      }
    });
  }

  decideSuperior(updatePlayerInfo: any[]): void {
    updatePlayerInfo.forEach((playerInfo) => {
      // 「現在の順位 <= 勝上がり可能順位」の場合はtrue
      playerInfo.isSuperior = playerInfo.rank <= Number(this.calSettingForm.value.winnerRanks);
    });
  }

}
