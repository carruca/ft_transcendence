export class DataLoaderModel {
  private users_: any[];
  private channels_: any[];

  public setChannels(channels: any[]) {
    this.channels_ = channels;
  }

  public setUsers(users: any[]) {
    this.users_ = users;
  }

  public getChannels() {
    return this.channels_;
  }

  public getUsers() {
    return this.users_;
  }
}
