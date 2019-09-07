export interface SocketClientList {
  userId: string;
  userName: string;
  id: string;
}

export interface SocketAction {
  type: string;
  payload: any;
}

export interface Message {
  server: string;
  channel: string;
  from: string;
  msg: string;
}

export interface PrivateMessage {
  from: string;
  to: string;
  msg: string;
}
