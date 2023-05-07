export interface User {
  id_user: number;
  score: number;
}

export interface Result {
  mode: string;
  start: Date;
  end: Date;
  users: Array<User>;
}
