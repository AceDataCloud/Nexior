import axios, { AxiosProgressEvent, AxiosResponse } from 'axios';
import {
  IChatdocConversation,
  IChatdocConversationResponse,
  IChatdocConversationsResponse,
  IChatdocDocumentResponse,
  IChatdocDocumentsResponse,
  IChatdocRepositoriesResponse,
  IChatdocRepositoryResponse
} from '@/models';
import { ACTION_UPDATE, BASE_URL_API } from '@/constants';
import { ACTION_CREATE, ACTION_DELETE, ACTION_RETRIEVE, ACTION_RETRIEVE_BATCH } from '@/constants';

class ChatdocOperator {
  async createRepository(
    payload: {
      name: string;
      description?: string;
    },
    options: { token: string }
  ): Promise<AxiosResponse<IChatdocRepositoryResponse>> {
    return await axios.post(
      `/chatdoc/repositories`,
      {
        action: ACTION_CREATE,
        name: payload.name,
        description: payload.description
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async deleteRepository(id: string, options: { token: string }): Promise<AxiosResponse<IChatdocRepositoryResponse>> {
    return await axios.post(
      `/chatdoc/repositories`,
      {
        action: ACTION_DELETE,
        id
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async getRepository(id: string, options: { token: string }): Promise<AxiosResponse<IChatdocRepositoryResponse>> {
    return await axios.post(
      `/chatdoc/repositories`,
      {
        action: ACTION_RETRIEVE,
        id
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async getAllRepositories(options: { token: string }): Promise<AxiosResponse<IChatdocRepositoriesResponse>> {
    return await axios.post(
      `/chatdoc/repositories`,
      {
        action: ACTION_RETRIEVE_BATCH
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async getAllDocuments(
    repositoryId: string,
    options: { token: string }
  ): Promise<AxiosResponse<IChatdocDocumentsResponse>> {
    return await axios.post(
      `/chatdoc/documents`,
      {
        action: ACTION_RETRIEVE_BATCH,
        repository_id: repositoryId
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async getAllConversations(
    repositoryId: string,
    options: { token: string }
  ): Promise<AxiosResponse<IChatdocConversationsResponse>> {
    return await axios.post(
      `/chatdoc/conversations`,
      {
        action: ACTION_RETRIEVE_BATCH,
        repository_id: repositoryId
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async getRepositories(filter: {
    ids?: string[];
    applicationId?: string;
  }): Promise<AxiosResponse<IChatdocRepositoriesResponse>> {
    return await axios.post(
      `/chatdoc/repositories`,
      {
        action: ACTION_RETRIEVE_BATCH,
        ...(filter.ids
          ? {
              ids: filter.ids
            }
          : {}),
        ...(filter.applicationId
          ? {
              application_id: filter.applicationId
            }
          : {})
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async createDocument(
    payload: {
      repositoryId: string;
      fileUrl: string;
      fileName: string;
    },
    options: { token: string }
  ): Promise<AxiosResponse<IChatdocDocumentResponse>> {
    return await axios.post(
      `/chatdoc/documents`,
      {
        action: ACTION_CREATE,
        repository_id: payload.repositoryId,
        file_url: payload.fileUrl,
        file_name: payload.fileName
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async retrieveDocument(id: string, options: { token: string }): Promise<AxiosResponse<IChatdocDocumentResponse>> {
    return await axios.post(
      `/chatdoc/documents`,
      {
        action: ACTION_RETRIEVE,
        id
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async retrieveConversation(id: string, options: { token: string }): Promise<AxiosResponse<IChatdocDocumentResponse>> {
    return await axios.post(
      `/chatdoc/conversations`,
      {
        action: ACTION_RETRIEVE,
        id
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async deleteDocument(id: string, options: { token: string }): Promise<AxiosResponse<IChatdocDocumentResponse>> {
    return await axios.post(
      `/chatdoc/documents`,
      {
        action: ACTION_DELETE,
        id
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async updateConversation(payload: IChatdocConversation) {
    return await axios.post(
      `/chatdoc/conversations`,
      {
        action: ACTION_UPDATE,
        id: payload.id,
        messages: payload.messages
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async deleteConversation(id: string): Promise<AxiosResponse<IChatdocDocumentResponse>> {
    return await axios.post(
      `/chatdoc/conversations`,
      {
        action: ACTION_DELETE,
        id
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async chatConversation(
    payload: { repositoryId: string; question: string; id?: string; knowledgeFallback?: boolean },
    options: { token: string; stream: (response: IChatdocConversationResponse) => void }
  ): Promise<AxiosResponse<IChatdocConversationResponse>> {
    return await axios.post(
      `/chatdoc/conversations`,
      {
        repository_id: payload.repositoryId,
        question: payload.question,
        id: payload.id,
        stateful: true
      },
      {
        headers: {
          authorization: `Bearer ${options.token}`,
          accept: 'application/x-ndjson',
          'content-type': 'application/json'
        },
        baseURL: BASE_URL_API,
        responseType: 'stream',
        onDownloadProgress: ({ event }: AxiosProgressEvent) => {
          const response = event.target.response;
          const lines = response.split('\r\n').filter((line: string) => !!line);
          const lastLine = lines[lines.length - 1];
          if (lastLine) {
            const jsonData = JSON.parse(lastLine);
            if (options?.stream) {
              options?.stream(jsonData as IChatdocConversationResponse);
            }
          }
        }
      }
    );
  }
}

export const chatdocOperator = new ChatdocOperator();
