import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils';

/**
 * Skills live in AuthBackend, not PlatformBackend. Nexior's access_token is
 * already an AuthBackend JWT, so we reuse the shared `httpClient` (bearer,
 * fingerprint, x-user-id, accept-language) and override only `baseURL`.
 */
const authApi = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

export type SkillSource = 'upload' | 'global' | 'catalog';

export interface ISkill {
  id: string;
  user: string | null;
  slug: string;
  name: string;
  description: string;
  when_to_use: string;
  content: string;
  frontmatter: Record<string, unknown>;
  required_connections: string[];
  allowed_tools: string[];
  asset_bundle_url: string;
  asset_bundle_sha256: string;
  asset_bundle_size: number;
  asset_bundle_files: string[];
  source: SkillSource;
  /** When source === 'catalog', the originating connector skill identifier
   * (e.g. 'anthropic/pdf'). Empty string for upload/global skills. */
  skill_identifier: string;
  version: string;
  enabled: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ISkillCreateMarkdownPayload {
  /** Full SKILL.md content (frontmatter + body). The server parses it. */
  content: string;
}

/**
 * One row in the public Skill catalog (the "Browse Skills" marketplace).
 *
 * Catalog rows are read-only mirrors of curated upstream sources
 * (anthropics/skills, …). Users discover them in the directory dialog
 * and "install" them, which copies the body into a personal Skill row
 * pointing at the same shared COS bundle.
 */
export interface ISkillCatalogItem {
  id: string;
  identifier: string;
  namespace: string;
  slug: string;
  name: string;
  description: string;
  when_to_use: string;
  frontmatter: Record<string, unknown>;
  required_connections: string[];
  allowed_tools: string[];
  tags: string[];
  category: string;
  publisher: string;
  publisher_logo_url: string;
  license: string;
  source_repo: string;
  source_path: string;
  source_url: string;
  source_commit: string;
  content: string;
  asset_bundle_files: string[];
  asset_bundle_size: number;
  version: string;
  installable: boolean;
  featured: boolean;
  install_count: number;
  /** True when the requesting user has already installed this catalog item.
   * Server-side computed by matching Skill.skill_identifier. */
  installed: boolean;
  created_at: string;
  last_synced_at: string;
}

export type SkillCatalogSort = 'popular' | 'recent' | 'name';

export interface ISkillCatalogListParams {
  q?: string;
  namespace?: string;
  category?: string;
  installable?: boolean;
  sort?: SkillCatalogSort;
  limit?: number;
  offset?: number;
}

export interface ISkillCatalogPage {
  total: number;
  limit: number;
  offset: number;
  items: ISkillCatalogItem[];
}

export interface ISkillCatalogFacet {
  namespace: string;
  category: string;
  count: number;
}

class SkillOperator {
  // AuthBackend Stage 3 (PR #160) split the old ``/skills/`` viewset:
  // public catalog moved to ``/api/v1/skills/`` (formerly
  // ``/api/v1/skills/catalog/``) and the user-owned CRUD lives at
  // ``/api/v1/skills/installed/``. ``SkillOperator`` manages the
  // current user's skills, so its base path is the ``installed/`` route.
  key = 'skills/installed';

  /** List the user's own uploads + every enabled global. */
  async list(): Promise<AxiosResponse<ISkill[]>> {
    return httpClient.get(`/${this.key}/`, authApi());
  }

  async get(id: string): Promise<AxiosResponse<ISkill>> {
    return httpClient.get(`/${this.key}/${id}/`, authApi());
  }

  /** Create from raw SKILL.md text. */
  async createMarkdown(payload: ISkillCreateMarkdownPayload): Promise<AxiosResponse<ISkill>> {
    return httpClient.post(`/${this.key}/`, payload, authApi());
  }

  /**
   * Create from a `.tar.gz` asset bundle. The server extracts SKILL.md from
   * the top of the archive and uploads the bundle to private COS. Returns
   * the parsed Skill row.
   */
  async createTarball(file: File): Promise<AxiosResponse<ISkill>> {
    const formData = new FormData();
    formData.append('tarball', file);
    return httpClient.post(`/${this.key}/`, formData, {
      ...authApi(),
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  /** Replace the SKILL.md content. Cannot edit the asset bundle in place. */
  async update(id: string, payload: { content: string }): Promise<AxiosResponse<ISkill>> {
    return httpClient.patch(`/${this.key}/${id}/`, payload, authApi());
  }

  async remove(id: string): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/${this.key}/${id}/`, authApi());
  }

  async enable(id: string): Promise<AxiosResponse<ISkill>> {
    return httpClient.post(`/${this.key}/${id}/enable/`, undefined, authApi());
  }

  async disable(id: string): Promise<AxiosResponse<ISkill>> {
    return httpClient.post(`/${this.key}/${id}/disable/`, undefined, authApi());
  }

  /**
   * Fetch a single file from a skill's asset bundle for preview.
   * Returns the raw bytes plus the server-guessed content type.
   * `path` must be one of `skill.asset_bundle_files` (server enforces).
   */
  async fetchFile(id: string, path: string): Promise<{ blob: Blob; contentType: string }> {
    const resp = await httpClient.get(`/${this.key}/${id}/files/`, {
      ...authApi(),
      params: { path },
      // ArrayBuffer rather than text so binary (PNG, etc.) survives.
      responseType: 'arraybuffer'
    });
    const contentType = (resp.headers['content-type'] as string) || 'application/octet-stream';
    return {
      blob: new Blob([resp.data], { type: contentType }),
      contentType
    };
  }
}

export const skillOperator = new SkillOperator();

/**
 * Public skill catalog operator — drives the "Browse Skills" directory
 * dialog. All endpoints are read-only except `install`, which copies a
 * catalog item into the current user's personal Skills.
 */
class SkillCatalogOperator {
  // Stage 3 (PR #160) collapsed ``/api/v1/skills/catalog/`` into
  // ``/api/v1/skills/`` — the public catalog now lives at the bare
  // ``/skills/`` prefix, with the user-owned CRUD pushed down to
  // ``/skills/installed/`` (see ``SkillOperator`` above).
  key = 'skills';

  async list(params: ISkillCatalogListParams = {}): Promise<AxiosResponse<ISkillCatalogPage>> {
    return httpClient.get(`/${this.key}/`, { ...authApi(), params });
  }

  async get(id: string): Promise<AxiosResponse<ISkillCatalogItem>> {
    return httpClient.get(`/${this.key}/${id}/`, authApi());
  }

  async categories(): Promise<AxiosResponse<{ namespaces: ISkillCatalogFacet[] }>> {
    return httpClient.get(`/${this.key}/categories/`, authApi());
  }

  /**
   * Install a catalog item. Optionally rename via `slug` to resolve a
   * collision with an existing personal skill.
   * Returns the freshly-created personal Skill row.
   */
  async install(id: string, payload: { slug?: string } = {}): Promise<AxiosResponse<ISkill>> {
    return httpClient.post(`/${this.key}/${id}/install/`, payload, authApi());
  }
}

export const skillCatalogOperator = new SkillCatalogOperator();
