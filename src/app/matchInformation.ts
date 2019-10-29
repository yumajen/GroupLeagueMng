import { Player } from './player'

export class MatchInformation {
    id: number;
    groupId: number;
    roundNumber: number;
    match: any;
    winnerId: number;
    loserId: number;
    isDraw: boolean;
}