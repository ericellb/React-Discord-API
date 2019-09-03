export interface SocketClient {
  userId: string;
  id: string;
}

export interface SocketAction {
  type: string;
  payload: any;
}
