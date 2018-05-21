export interface IMessage {
  author: string;
  branch?: string | string[];
  channel?: string;
  mentions?: string[];
  root?: string;
  text: string;
  timestamp: number;
  type: string;
}

export interface IConversationState {
  contexts: string[];
}

export async function handle(message: IMessage): Promise<string> {
  return "";
}
