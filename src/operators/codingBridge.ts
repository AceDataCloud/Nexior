import axios, { AxiosResponse } from 'axios';
import { ICodingBridgeClaimResponse, ICodingBridgeNode } from '@/models';
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
}

export const codingBridgeOperator = new CodingBridgeOperator();
