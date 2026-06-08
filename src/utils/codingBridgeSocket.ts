import {
  WS_URL_CODING_BRIDGE,
  CB_BROWSER_TO_NODE,
  CB_BROWSER_LIST_NODES,
  CB_NODE_TO_BROWSER,
  CB_NODES_SNAPSHOT,
  CB_NODE_STATUS,
  CB_ERROR,
  CB_RECONNECT_MIN_MS,
  CB_RECONNECT_MAX_MS
} from '@/constants';
import { ICodingBridgeNode } from '@/models';

export interface ICodingBridgeSocketHandlers {
  onOpen?: () => void;
  onClose?: () => void;
  /** Inner `node.to_browser` payload plus the originating node id. */
  onEvent?: (payload: Record<string, any>, fromNode: string | undefined) => void;
  onNodesSnapshot?: (nodes: ICodingBridgeNode[]) => void;
  onNodeStatus?: (nodeId: string, status: 'online' | 'offline') => void;
  onRelayError?: (code: string, message: string) => void;
}

const makeId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
};

/**
 * Single browser WebSocket toward the `coding-bridge` relay.
 *
 * The relay authenticates the Ace JWT passed as `?token=`, fans node events
 * back to every browser the user has open, and routes browser commands to the
 * addressed node. This client owns reconnection with exponential backoff and
 * never executes anything itself — it only serialises envelopes.
 */
export class CodingBridgeSocket {
  private ws: WebSocket | undefined;
  private readonly token: string;
  private readonly handlers: ICodingBridgeSocketHandlers;
  private reconnectDelay = CB_RECONNECT_MIN_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  private closedByUser = false;

  constructor(token: string, handlers: ICodingBridgeSocketHandlers) {
    this.token = token;
    this.handlers = handlers;
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  connect(): void {
    this.closedByUser = false;
    this.open();
  }

  private open(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const url = `${WS_URL_CODING_BRIDGE}?token=${encodeURIComponent(this.token)}`;
    let socket: WebSocket;
    try {
      socket = new WebSocket(url);
    } catch (error) {
      console.warn('[codingBridge] failed to open socket', error);
      this.scheduleReconnect();
      return;
    }
    this.ws = socket;
    socket.onopen = () => {
      this.reconnectDelay = CB_RECONNECT_MIN_MS;
      this.handlers.onOpen?.();
    };
    socket.onmessage = (event) => this.onMessage(event);
    socket.onclose = () => {
      this.handlers.onClose?.();
      if (!this.closedByUser) {
        this.scheduleReconnect();
      }
    };
    socket.onerror = () => {
      // `onclose` always follows `onerror`; reconnection is handled there.
      socket.close();
    };
  }

  private onMessage(event: MessageEvent): void {
    let message: any;
    try {
      message = JSON.parse(event.data);
    } catch {
      return;
    }
    const payload = message?.payload ?? {};
    switch (message?.type) {
      case CB_NODE_TO_BROWSER:
        this.handlers.onEvent?.(payload, message?.from_node);
        break;
      case CB_NODES_SNAPSHOT:
        this.handlers.onNodesSnapshot?.((payload.nodes ?? []) as ICodingBridgeNode[]);
        break;
      case CB_NODE_STATUS:
        this.handlers.onNodeStatus?.(payload.node_id, payload.status);
        break;
      case CB_ERROR:
        this.handlers.onRelayError?.(payload.code ?? 'error', payload.message ?? '');
        break;
      default:
        break;
    }
  }

  private scheduleReconnect(): void {
    if (this.closedByUser || this.reconnectTimer) {
      return;
    }
    const delay = this.reconnectDelay;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      this.open();
    }, delay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, CB_RECONNECT_MAX_MS);
  }

  private sendEnvelope(type: string, extra: Record<string, any>): void {
    if (!this.isOpen) {
      return;
    }
    const envelope = { v: 1, id: makeId(), ts: Date.now(), type, ...extra };
    this.ws?.send(JSON.stringify(envelope));
  }

  /** Forward an inner action payload to a specific node. */
  sendToNode(nodeId: string, payload: Record<string, any>): void {
    this.sendEnvelope(CB_BROWSER_TO_NODE, { node_id: nodeId, payload });
  }

  /** Ask the relay to re-send the live node snapshot. */
  listNodes(): void {
    this.sendEnvelope(CB_BROWSER_LIST_NODES, {});
  }

  close(): void {
    this.closedByUser = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      this.ws.onopen = null;
      try {
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = undefined;
    }
  }
}
