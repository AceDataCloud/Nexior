export interface IRequest {
  question: string;
  stateful?: boolean;
  conversation_id?: string;
}

export interface IResponse {
  answer: string;
  conversation_id?: string;
}
