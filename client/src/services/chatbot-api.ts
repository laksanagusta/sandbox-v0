import {
  KnowledgeBase,
  KnowledgeBasesResponse,
  KnowledgeBaseResponse,
  KnowledgeBaseDetailResponse,
  UploadFilesResponse,
  ChatSession,
  ChatSessionResponse,
  ChatSessionsResponse,
  ChatMessagesResponse,
  SendMessageResponse,
} from "../../../shared/types";
import serviceHelper from "./general";
import { getApiBaseUrl } from "@/lib/env";

const CHATBOT_API_BASE = `${getApiBaseUrl()}/api/v1/chatbot`;

export const chatbotApi = {
  // Knowledge Base Management
  createKnowledgeBase: async (name: string): Promise<KnowledgeBaseResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${CHATBOT_API_BASE}/knowledge-bases`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  getKnowledgeBases: async (): Promise<KnowledgeBasesResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${CHATBOT_API_BASE}/knowledge-bases`);
  },

  getKnowledgeBase: async (id: string): Promise<KnowledgeBaseDetailResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${CHATBOT_API_BASE}/knowledge-bases/${id}`);
  },

  deleteKnowledgeBase: async (id: string): Promise<void> => {
    const response = await fetch(`${CHATBOT_API_BASE}/knowledge-bases/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceHelper.getAuthToken()}`,
      },
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("unauthorized: only super admin can delete knowledge bases");
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Delete failed: ${response.status}`);
    }
  },

  uploadFiles: async (
    knowledgeBaseId: string,
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<UploadFilesResponse> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            reject(new Error("Invalid JSON response"));
          }
        } else if (xhr.status === 403) {
          reject(new Error("unauthorized: only super admin can upload files"));
        } else {
          try {
            const errorData = JSON.parse(xhr.responseText);
            reject(new Error(errorData.message || `Upload failed: ${xhr.status}`));
          } catch {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.open("POST", `${CHATBOT_API_BASE}/knowledge-bases/${knowledgeBaseId}/files`);
      xhr.setRequestHeader("Authorization", `Bearer ${serviceHelper.getAuthToken()}`);
      xhr.send(formData);
    });
  },

  // Chat Session Management
  createSession: async (
    knowledgeBaseId: string,
    title: string
  ): Promise<ChatSessionResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${CHATBOT_API_BASE}/sessions`, {
      method: "POST",
      body: JSON.stringify({ knowledge_base_id: knowledgeBaseId, title }),
    });
  },

  getSessions: async (): Promise<ChatSessionsResponse> => {
    return serviceHelper.fetchWithErrorHandling(`${CHATBOT_API_BASE}/sessions`);
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const response = await fetch(`${CHATBOT_API_BASE}/sessions/${sessionId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceHelper.getAuthToken()}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Delete session failed: ${response.status}`);
    }
  },

  getMessages: async (sessionId: string): Promise<ChatMessagesResponse> => {
    return serviceHelper.fetchWithErrorHandling(
      `${CHATBOT_API_BASE}/sessions/${sessionId}/messages`
    );
  },

  sendMessage: async (
    sessionId: string,
    content: string
  ): Promise<SendMessageResponse> => {
    return serviceHelper.fetchWithErrorHandling(
      `${CHATBOT_API_BASE}/sessions/${sessionId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content }),
      }
    );
  },
};

export default chatbotApi;
