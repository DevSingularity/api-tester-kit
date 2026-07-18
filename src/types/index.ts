export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD"
  | "TRACE"
  | "CONNECT";

export type AuthType =
  | "none"
  | "basic"
  | "bearer"
  | "jwt"
  | "oauth2"
  | "apikey"
  | "digest"
  | "custom";

export type BodyType =
  | "none"
  | "json"
  | "xml"
  | "html"
  | "text"
  | "binary"
  | "form-data"
  | "x-www-form-urlencoded"
  | "file";

export type ProxyMode = "direct" | "proxy" | "auto";

export interface KeyValuePair {
  id: string;
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface AuthConfig {
  type: AuthType;
  basic?: {
    username: string;
    password: string;
  };
  bearer?: {
    token: string;
  };
  apikey?: {
    key: string;
    value: string;
    addTo: "header" | "query";
  };
  jwt?: {
    token: string;
  };
  custom?: {
    headers: KeyValuePair[];
  };
}

export interface RequestBody {
  type: BodyType;
  raw?: string;
  json?: string;
  formUrlEncoded?: KeyValuePair[];
  formData?: Array<KeyValuePair & { type: "text" | "file"; fileName?: string }>;
}

export interface ApiRequest {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValuePair[];
  headers: KeyValuePair[];
  body: RequestBody;
  auth: AuthConfig;
  preRequestScript?: string;
  testScript?: string;
  collectionId?: string;
  folderId?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
  timestamp: string;
}

export interface RequestTab {
  id: string;
  requestId: string;
  name: string;
  isDirty: boolean;
  isPinned: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  requests: ApiRequest[];
  folders: Folder[];
  environments: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  requests: ApiRequest[];
  folders: Folder[];
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isSecret: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  request: ApiRequest;
  response: ApiResponse;
  environment?: string;
  timestamp: string;
}
