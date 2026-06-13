import axios, { AxiosResponse } from 'axios';
import { ICodingBridgeClaimResponse, ICodingBridgeNode, ICodingBridgePushConfig } from '@/models';
import { BASE_URL_CODING_BRIDGE } from '@/constants';

/**
 * REST client for the `coding-bridge` relay (browser side, Ace JWT).
 * Live session traffic does NOT go through here — it runs over the WebSocket
 * in `src/utils/codingBridgeSocket.ts`. This operator only covers pairing and
 * node lifecycle management.
 */
class CodingBridgeOperator {
  private headers(token: string) {
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      accept: 'application/json'
    };
  }

  /** Bind a node's pairing code to the signed-in user. */
  async claimPair(pairCode: string, options: { token: string }): Promise<AxiosResponse<ICodingBridgeClaimResponse>> {
    return await axios.post(
      '/pair/claim',
      { pair_code: pairCode },
      { headers: this.headers(options.token), baseURL: BASE_URL_CODING_BRIDGE }
    );
  }

  /** List the nodes owned by the signed-in user. */
  async getNodes(options: { token: string }): Promise<AxiosResponse<{ nodes: ICodingBridgeNode[] }>> {
    return await axios.get('/api/nodes', {
      headers: this.headers(options.token),
      baseURL: BASE_URL_CODING_BRIDGE
    });
  }

  /** Revoke a node and drop any live connection it holds. */
  async deleteNode(nodeId: string, options: { token: string }): Promise<AxiosResponse<{ ok: boolean }>> {
    return await axios.delete(`/api/nodes/${encodeURIComponent(nodeId)}`, {
      headers: this.headers(options.token),
      baseURL: BASE_URL_CODING_BRIDGE
    });
  }

  /** Push capability + VAPID public key (no auth needed). */
  async getPushConfig(): Promise<AxiosResponse<ICodingBridgePushConfig>> {
    return await axios.get('/api/push/config', { baseURL: BASE_URL_CODING_BRIDGE });
  }

  /** Register a web-push subscription or an FCM device token for the user. */
  async savePushSubscription(
    body:
      | { kind: 'webpush'; subscription: PushSubscriptionJSON; ua?: string }
      | { kind: 'fcm'; token: string; ua?: string },
    options: { token: string }
  ): Promise<AxiosResponse<{ ok: boolean }>> {
    return await axios.post('/api/push/subscriptions', body, {
      headers: this.headers(options.token),
      baseURL: BASE_URL_CODING_BRIDGE
    });
  }

  /** Unregister a subscription by its web-push endpoint or FCM token. */
  async deletePushSubscription(
    body: { endpoint?: string; token?: string },
    options: { token: string }
  ): Promise<AxiosResponse<{ ok: boolean }>> {
    return await axios.delete('/api/push/subscriptions', {
      data: body,
      headers: this.headers(options.token),
      baseURL: BASE_URL_CODING_BRIDGE
    });
  }
}

export const codingBridgeOperator = new CodingBridgeOperator();
