import {
  ChallengeTypeEnum,
} from '../enum';

export class ChallengeDTO {
  type: ChallengeTypeEnum;
  sourceId: string;
  targetId: string;

  constructor(challenge: { type: ChallengeTypeEnum, sourceId: string, targetId: string }) {
    this.type = challenge.type;
    this.sourceId = challenge.sourceId;
    this.targetId = challenge.targetId;
  }
}
