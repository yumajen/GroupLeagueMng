import { Component, OnInit } from '@angular/core';
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

  getRoundNumber(groupId: number): Number[] {
    // 各グループの人数に応じた回戦数を計算し、回戦数分の空要素を持った配列を返す
    let count = this.linkages.filter((linkage) => {
      return linkage.groupId == groupId;
    }).length;

    return count % 2 == 0 ? Array(count - 1) : Array(count);
  }

  drawLotsCombination(groupId: number): any[] {
    let containedPlayers = [];
    let matches = [];

    // グループ内に含まれるプレイヤー情報をシャッフルして配列に格納する
    containedPlayers = this.getPlayersOfEachGroups(groupId);
    containedPlayers = this.executeShuffle(containedPlayers);

    // 組み合わせの配列に対戦する2人1組の配列をネスティングで格納する
    while (containedPlayers.length > 1) {
      matches.push([containedPlayers.shift(), containedPlayers.shift()]);
    }

    return matches;
  }

  executeShuffle(containedPlayers: Player[]): Player[] {
    let array = containedPlayers;
    for (let i = array.length - 1; i >= 0; i--) {
      let rand = Math.floor(Math.random() * (i + 1));
      [array[i], array[rand]] = [array[rand], array[i]];
    }

    return Array.from(array);
  }

}
