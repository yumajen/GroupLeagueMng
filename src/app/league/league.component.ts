import { Component, OnInit, ComponentFactoryResolver } from '@angular/core';
import { Player } from '../player';
import { Group } from '../group';
import { Linkage } from '../linkage';
import { PlayersService } from '../players.service';
import { GroupsService } from '../groups.service';

@Component({
  selector: 'app-league',
  templateUrl: './league.component.html',
  styleUrls: ['./league.component.css']
})
export class LeagueComponent implements OnInit {

  players: Player[];
  groups: Group[];
  linkages: Linkage[];
  matchedInformations: any[] = []; // 各プレイヤーに対しする対戦済みプレイヤー情報を格納する配列

  constructor(
    private playersService: PlayersService,
    private groupsService: GroupsService
  ) {
    this.getPlayers();
    this.getGroups();
    this.getLinkages();
  }

  ngOnInit() {
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

  getLinkages(): void {
    this.groupsService.getLinkages().subscribe(
      (linkages) => {
        this.linkages = linkages;
      }
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

    return eachPlayers;
  }

  getRoundNumber(groupId: number): number[] {
    // 各グループの人数に応じた回戦数を計算し、回戦数分の空要素を持った配列を返す
    let count = this.linkages.filter((linkage) => {
      return linkage.groupId == groupId;
    }).length;

    return count % 2 == 0 ? Array(count - 1) : Array(count);
  }

  drawLotsCombination(groupId: number, roundNumber: number): any[] {
    let containedPlayers = [];
    let matches = [];

    containedPlayers = this.getPlayersOfEachGroups(groupId);
    if (roundNumber == 1) {
      // 各グループの最初のラウンドのみ
      containedPlayers.forEach((player) => {
        this.matchedInformations.push(
          { id: player.id, matched: [] }
        );
      });
    }

    // グループ内に含まれるプレイヤー情報をシャッフルして配列に格納する
    let shuffledPlayers = this.executeShuffle(containedPlayers);

    // 組み合わせの配列に対戦する2人1組の配列をネスティングで格納する
    while (shuffledPlayers.length > 1) {
      // 対戦ペアの1人目を選ぶ
      let player1 = shuffledPlayers.shift();
      // player1の対戦済み情報を取得
      let player1MatchInfo = this.matchedInformations.filter((info) => {
        return info.id == player1.id;
      });
      // player1と既に対戦済みのプレイヤー情報を取得
      let alreadyMatched = player1MatchInfo[0].matched;

      let player2: Player;
      for (let player of shuffledPlayers) {
        if (alreadyMatched.indexOf(player) == -1) {
          player2 = shuffledPlayers.splice(shuffledPlayers.indexOf(player), 1)[0];
          break;
        }
      }
      matches.push([player1, player2]);

      // player1, player2を互いのmatchedに格納する
      this.matchedInformations.forEach((info) => {
        if (info.id == player1.id) {
          info.matched.push(player2);
        }
        if (info.id == player2.id) {
          info.matched.push(player1);
        }
      });
    }

    if ((containedPlayers.length % 2 == 0 && roundNumber == containedPlayers.length - 1) ||
      (containedPlayers.length % 2 != 0 && roundNumber == containedPlayers.length)) {
      // 各グループの最後のラウンドのみ
      this.matchedInformations = [];
    }

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

}
