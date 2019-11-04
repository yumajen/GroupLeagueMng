import { Player } from './player'

export class MatchInformation {
    id: number;
    groupId: number;
    roundNumber: number;
    match: any;
    winnerId: number;
    isDraw: boolean;
}