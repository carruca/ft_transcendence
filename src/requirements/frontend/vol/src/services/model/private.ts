import {
  readonly,
  reactive,
} from 'vue';

export class Private {
  public readonly nickname: string;
  public readonly events_ = reactive(new Map<string, Event>());

  constructor(nickname: string) {
    this.nickname = nickname;
  }

  addEvent(event: Event) {
    if (this.events_.size >= this.maxEvents_) {
      this.events_.delete(this.events_.keys().next().value);
    }
    this.events_.set(event.id, event);
  }
}
