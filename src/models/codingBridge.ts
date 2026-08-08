import type {
  CodingAgentAttachment,
  CodingAgentCapabilities,
  CodingAgentEvent,
  CodingAgentEventKind,
  CodingAgentHistoryDetail,
  CodingAgentHistorySummary,
  CodingAgentModelOption,
  CodingAgentPermissionRequest,
  CodingAgentProvider,
  CodingAgentProviderCapability,
  CodingAgentSession,
  CodingAgentSessionStatus,
  CodingAgentSlashCommand
} from '@acedatacloud/core/coding-agent';

/** A local node daemon owned by the current user. */
export interface ICodingBridgeNode {
  node_id: string;
  name: string;
  status: 'online' | 'offline';
  capabilities?: string[];
  last_seen?: number;
}

export type ICodingBridgeSessionStatus = CodingAgentSessionStatus;
export type ICodingBridgeHistoryProvider = CodingAgentProvider;
export type ICodingBridgeModelOption = CodingAgentModelOption;
export type ICodingBridgeProviderCapability = CodingAgentProviderCapability;
export type ICodingBridgeSlashCommand = CodingAgentSlashCommand;
export type ICodingBridgeCapabilities = CodingAgentCapabilities;
export type ICodingBridgeSession = CodingAgentSession & { node_id: string };
export type ICodingBridgeHistorySummary = CodingAgentHistorySummary;
export type ICodingBridgeHistoryDetail = CodingAgentHistoryDetail;
export type ICodingBridgeEventKind = CodingAgentEventKind;
export type ICodingBridgeEvent = CodingAgentEvent;
export type ICodingBridgeAttachment = CodingAgentAttachment;
export type ICodingBridgePermissionRequest = CodingAgentPermissionRequest & { node_id: string };

export interface ICodingBridgeComposerPrefs {
  cwd?: string;
  provider?: string;
  model?: string;
  permissionMode?: string;
  effort?: string;
}

export interface ICodingBridgeDirEntry {
  name: string;
  path: string;
  type: 'dir' | 'file';
}

export interface ICodingBridgeDirListing {
  path: string;
  parent: string | null;
  sep: string;
  entries: ICodingBridgeDirEntry[];
  truncated?: boolean;
  error?: string;
}

export type ICodingBridgeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ICodingBridgeClaimResponse {
  ok: boolean;
  node_name: string;
}

export interface ICodingBridgePushConfig {
  enabled: boolean;
  web_push_enabled: boolean;
  fcm_enabled: boolean;
  vapid_public_key: string;
}
