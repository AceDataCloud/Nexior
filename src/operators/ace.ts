import type { AxiosResponse } from 'axios';
import { httpClient } from './common';

export interface AceTier {
  tier: number;
  code: string;
  name: string;
  threshold: number;
  discount: number;
}

export interface AceBenefit {
  code: 'api_discount' | 'early_access' | 'referral_bonus' | 'nexior_holder_lab' | 'ace_operator';
  status: 'active' | 'eligible' | 'coming_soon' | 'locked';
  minimum_tier: number;
}

export interface AceHolderSummary {
  wallet?: {
    address?: string | null;
    balance?: number;
    verification_status?: 'legacy_unverified' | 'verified' | 'revoked';
    balance_checked_at?: string | null;
    public_holder_status?: boolean;
  } | null;
  balance_fresh: boolean;
  holder_status?: 'holder' | 'not_qualified';
  current_tier?: AceTier;
  next_tier?: AceTier & { remaining: number; progress: number };
  benefits?: AceBenefit[];
  monthly_savings?: {
    calls: number;
    saved_credits: number;
  };
}

export interface AceOperatorProfile {
  id: string;
  display_name: string;
  bio: string;
  status: 'pending' | 'approved' | 'suspended';
  public: boolean;
  featured: boolean;
  current_tier: number;
  eligible: boolean;
  featured_eligible: boolean;
}

export interface AceOperatorState {
  profile: AceOperatorProfile | null;
  current_tier?: number;
  eligible?: boolean;
  featured_eligible?: boolean;
  minimum_tier: number;
}

class AceOperator {
  summary(): Promise<AxiosResponse<AceHolderSummary>> {
    return httpClient.get('/coin-wallet/summary/');
  }

  operatorProfile(): Promise<AxiosResponse<AceOperatorState>> {
    return httpClient.get('/ace-operator/');
  }

  applyOperator(data: {
    display_name: string;
    bio: string;
    public: boolean;
  }): Promise<AxiosResponse<AceOperatorState>> {
    return httpClient.post('/ace-operator/', data);
  }

  updateOperator(
    data: Partial<{ display_name: string; bio: string; public: boolean }>
  ): Promise<AxiosResponse<AceOperatorState>> {
    return httpClient.patch('/ace-operator/', data);
  }
}

export const aceOperator = new AceOperator();
