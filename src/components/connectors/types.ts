import { IConnector, IConnectorProvider, IMcpServer } from '@/models';

/**
 * Unified row item for the Connectors rail. Built-in providers and custom MCP
 * servers share the same UI so we project both into a common shape.
 */
export interface IConnectorItem {
  /** Composite id: `provider:<id>` or `mcp:<id>` — globally unique across kinds. */
  id: string;
  kind: 'provider' | 'custom';
  name: string;
  description?: string;
  icon?: string;
  isCustom: boolean;
  connected: boolean;
  provider?: IConnectorProvider;
  connector?: IConnector;
  mcp?: IMcpServer;
}

export const PROVIDER_ICONS: Record<string, string> = {
  google: 'fa-brands fa-google',
  github: 'fa-brands fa-github',
  slack: 'fa-brands fa-slack',
  vercel: 'fa-brands fa-v',
  figma: 'fa-brands fa-figma'
};

export type ToolPermission = 'always' | 'ask' | 'never';

export const PERMISSION_STORAGE_KEY = 'nexior.connectors.permissions';

export function loadPermissions(): Record<string, Record<string, ToolPermission>> {
  try {
    const raw = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export function savePermissions(data: Record<string, Record<string, ToolPermission>>): void {
  try {
    localStorage.setItem(PERMISSION_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}
