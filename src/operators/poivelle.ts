import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { BASE_URL_POIVELLE } from '@/constants';
import type {
  IPoivelleActionDryRun,
  IPoivelleAsset,
  IPoivelleGraphCommandRequest,
  IPoivelleGraphSnapshot,
  IPoivelleMembership,
  IPoivelleProject,
  IPoivelleProposal,
  IPoivelleRevision,
  IPoivelleRun,
  IPoivelleRunDetail,
  IPoivelleTimeline,
  IPoivelleWorkspace
} from '@/models';

export interface IPoivelleRequestOptions {
  token: string;
}

const encode = (value: string) => encodeURIComponent(value);

class PoivelleOperator {
  private config(options: IPoivelleRequestOptions): AxiosRequestConfig {
    return {
      baseURL: BASE_URL_POIVELLE,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json'
      }
    };
  }

  getWorkspaces(options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleWorkspace[]>> {
    return axios.get('/poivelle/workspaces', this.config(options));
  }

  createWorkspace(
    payload: { name: string; monthly_limit_microcredits?: number },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleWorkspace>> {
    return axios.post('/poivelle/workspaces', payload, this.config(options));
  }

  getProjects(options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleProject[]>> {
    return axios.get('/poivelle/projects', this.config(options));
  }

  getWorkspaceProjects(
    workspaceId: string,
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleProject[]>> {
    return axios.get(`/poivelle/workspaces/${encode(workspaceId)}/projects`, this.config(options));
  }

  getMembers(workspaceId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleMembership[]>> {
    return axios.get(`/poivelle/workspaces/${encode(workspaceId)}/members`, this.config(options));
  }

  createProject(
    payload: { workspace_id: string; title: string; domain?: string; skill?: string },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleProject>> {
    return axios.post('/poivelle/projects', payload, this.config(options));
  }

  updateProject(
    projectId: string,
    payload: { title?: string; automation_policy_snapshot_id?: string },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleProject>> {
    return axios.patch(`/poivelle/projects/${encode(projectId)}`, payload, this.config(options));
  }

  getGraph(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleGraphSnapshot>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/graph/snapshot`, this.config(options));
  }

  applyGraphCommand(
    projectId: string,
    payload: IPoivelleGraphCommandRequest,
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<{ id: string; result_graph_version: number }>> {
    return axios.post(`/poivelle/projects/${encode(projectId)}/graph/commands`, payload, this.config(options));
  }

  saveLayout(
    projectId: string,
    view: string,
    layouts: IPoivelleGraphSnapshot['layouts'],
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleGraphSnapshot['layouts']>> {
    return axios.put(
      `/poivelle/projects/${encode(projectId)}/layouts/${encode(view)}`,
      { layouts },
      this.config(options)
    );
  }

  getAssets(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleAsset[]>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/assets`, this.config(options));
  }

  importAsset(
    workspaceId: string,
    payload: {
      project_id?: string;
      title: string;
      kind: string;
      source_url: string;
      content_hash: string;
      rights: Record<string, unknown>;
    },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<{ asset: IPoivelleAsset }>> {
    return axios.post(`/poivelle/workspaces/${encode(workspaceId)}/assets/imports`, payload, this.config(options));
  }

  getRevisions(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleRevision[]>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/revisions`, this.config(options));
  }

  createRevision(
    projectId: string,
    payload: { graph_version: number; message?: string },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleRevision>> {
    return axios.post(`/poivelle/projects/${encode(projectId)}/revisions`, payload, this.config(options));
  }

  getProposals(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleProposal[]>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/proposals`, this.config(options));
  }

  rejectProposal(
    projectId: string,
    proposalId: string,
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleProposal>> {
    return axios.post(
      `/poivelle/projects/${encode(projectId)}/proposals/${encode(proposalId)}/reject`,
      {},
      this.config(options)
    );
  }

  getRuns(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleRun[]>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/runs`, this.config(options));
  }

  getRun(
    projectId: string,
    runId: string,
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleRunDetail>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/runs/${encode(runId)}`, this.config(options));
  }

  cancelRun(projectId: string, runId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleRun>> {
    return axios.post(`/poivelle/projects/${encode(projectId)}/runs/${encode(runId)}/cancel`, {}, this.config(options));
  }

  getTimeline(projectId: string, options: IPoivelleRequestOptions): Promise<AxiosResponse<IPoivelleTimeline>> {
    return axios.get(`/poivelle/projects/${encode(projectId)}/timeline`, this.config(options));
  }

  dryRunAction(
    projectId: string,
    payload: {
      action_type: 'generate' | 'evaluate' | 'compose' | 'export' | 'publish';
      target_ids: string[];
      graph_version: number;
      revision_id: string;
      options?: Record<string, unknown>;
    },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<IPoivelleActionDryRun>> {
    return axios.post(`/poivelle/projects/${encode(projectId)}/actions/dry-run`, payload, this.config(options));
  }

  confirmAction(
    projectId: string,
    payload: { dry_run_id: string; revision_id: string; confirmation_nonce: string; idempotency_key: string },
    options: IPoivelleRequestOptions
  ): Promise<AxiosResponse<{ run: IPoivelleRun; steps: unknown[] }>> {
    return axios.post(`/poivelle/projects/${encode(projectId)}/actions/confirm`, payload, this.config(options));
  }
}

export const poivelleOperator = new PoivelleOperator();
