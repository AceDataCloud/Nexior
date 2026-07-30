export type BrowserDeviceStatus = 'pending' | 'active' | 'suspended' | 'quarantined' | 'revoked';
export type BrowserDeviceIncompatibilityReason =
  | 'device_inactive'
  | 'wire_contract_mismatch'
  | 'extension_too_old'
  | 'device_offline';

export interface IBrowserDevice {
  id: string;
  name: string;
  platform: string;
  extension_version: string;
  wire_contract_digest: string;
  capabilities: string[];
  status: BrowserDeviceStatus;
  online: boolean;
  compatible: boolean;
  incompatibility_reason: BrowserDeviceIncompatibilityReason | null;
  active_session_count: number;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IBrowserPairingChallenge {
  challenge_id: string;
  code: string;
  expires_at_ms: number;
}

export interface IBrowserPairingClaim {
  claim_id: string;
  challenge_id: string;
  key_fingerprint: string;
  installation_id: string;
  installation_instance: string;
  origin: string;
  platform: string;
  extension_version: string;
  expires_at_ms: number;
}

export interface IBrowserPairingConfirmation {
  status: 'confirmed';
  claim_id: string;
  device: IBrowserDevice;
}

export interface IBrowserPairingRejection {
  status: 'rejected';
  claim_id: string;
}
