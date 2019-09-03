interface SocketClient {
  userId: string;
  id: string;
}

interface SocketAction {
  type: string;
  payload: any;
}
