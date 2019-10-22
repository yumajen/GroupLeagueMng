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
  containedPlayers: Player[]; // 各グループに含まれているプレイヤーの配列
  shuffledPlayers: Player[]; // シャッフルされたプレイヤーの配列
  centerPlayer: Player; // Kirkmanの組分け法の円の中心に配置されるプレイヤー
  numberOfMatches: number; // 各グループ1回戦当たりの対戦数
  breakPlayer: Player; // 対戦一回休みのプレイヤー(グループ内人数が奇数人の場合)

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
      this.breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
    } else {
      matches.push([player1, player2]);
    }

    for (let i = 1; i <= this.numberOfMatches - 1; i++) {
      player1 = this.shuffledPlayers[i];
      player2 = this.shuffledPlayers[this.containedPlayers.length - i - 1];
      if (this.isSameObject(player1, dummyPlayer) || this.isSameObject(player2, dummyPlayer)) {
        this.breakPlayer = this.isSameObject(player1, dummyPlayer) ? player2 : player1;
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

}
