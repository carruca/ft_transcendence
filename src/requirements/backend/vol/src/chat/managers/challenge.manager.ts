import {
    UserModel as User,
    ChallengeModel as Challenge
} from '../models';

import { Mode as GameMode } from '../../game/game.interface';
import { v4 as uuidv4 } from 'uuid';

export class ChallengeManager {
    private challengesByPlayer_ = new Map<User, Challenge>;
    private challengesByUUID_ = new Map<string, Challenge>;

    getChallengeByUUID(challengeUUID: string): Challenge | undefined {
        return this.challengesByUUID_.get(challengeUUID);
    }

    getChallengeByPlayer(player: User): Challenge | undefined {
        return this.challengesByPlayer_.get(player);
    }

    startChallenge(player: User, challengeMode: GameMode): Challenge {
        const challenge = new Challenge(challengeMode);

        challenge.addPlayer(player);
        this.challengesByPlayer_.set(player, challenge);
        this.challengesByUUID_.set(challenge.uuid, challenge);
        return challenge;
    }

    addPlayerToChallengeUUID(challengeUUID: string, player: User): boolean {
        const challenge = this.getChallengeByUUID(challengeUUID);
        
        if (!challenge)
            return false;
        return challenge.addPlayer(player); 
    }

    removePlayerFromChallengeUUID(challengeUUID: string, player: User): boolean {
        const challenge = this.getChallengeByUUID(challengeUUID);

        if (!challenge)
            return false;
        return challenge.removePlayer(player);
    }
}
