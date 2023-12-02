import {
  readonly,
  reactive,
} from 'vue';

import {
	Event,
} from '../model';

export class Private {
  private readonly maxEvents_: number = 100;
  public readonly id: string;
  public readonly nickname: string;
  public readonly events_ = reactive(new Map<string, Event>());

  constructor(id: string, nickname: string) {
    this.id = id;
    this.nickname = nickname;
  }

  addEvent(event: Event) {
    if (this.events_.size >= this.maxEvents_) {
      this.events_.delete(this.events_.keys().next().value);
    }
    this.events_.set(event.id, event);
  }
}
