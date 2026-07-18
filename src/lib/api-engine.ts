import type { ApiRequest, ApiResponse, ProxyMode } from "@/types";

interface SendRequestOptions {
  request: ApiRequest;
  proxyMode: ProxyMode;
  variables: Record<string, string>;
  signal?: AbortSignal;
}

function substituteVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`);
}

function buildHeaders(
  request: ApiRequest,
  variables: Record<string, string>
): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled && h.key) {
      headers[substituteVariables(h.key, variables)] = substituteVariables(
        h.value,
        variables
      );
    }
  }
  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers["Authorization"] = `Bearer ${substituteVariables(
      request.auth.bearer.token,
      variables
    )}`;
  }
  if (request.auth.type === "basic" && request.auth.basic) {
    const creds = btoa(
      `${substituteVariables(
        request.auth.basic.username,
        variables
      )}:${substituteVariables(request.auth.basic.password, variables)}`
    );
    headers["Authorization"] = `Basic ${creds}`;
  }
  if (request.auth.type === "apikey" && request.auth.apikey) {
    if (request.auth.apikey.addTo === "header") {
      headers[substituteVariables(request.auth.apikey.key, variables)] =
        substituteVariables(request.auth.apikey.value, variables);
    }
  }
  return headers;
}

function buildUrl(
  request: ApiRequest,
  variables: Record<string, string>
): string {
  let url = substituteVariables(request.url, variables);

  const searchParams = new URLSearchParams();
  for (const p of request.params) {
    if (p.enabled && p.key) {
      searchParams.append(
        substituteVariables(p.key, variables),
        substituteVariables(p.value, variables)
      );
    }
  }
  const qs = searchParams.toString();
  if (qs) {
    url += (url.includes("?") ? "&" : "?") + qs;
  }

  return url;
}

function buildBody(request: ApiRequest, variables: Record<string, string>): string | undefined {
  if (request.body.type === "none") return undefined;
  if (request.body.type === "json" || request.body.type === "xml" || request.body.type === "text" || request.body.type === "html") {
    return substituteVariables(request.body.raw ?? "", variables);
  }
  if (request.body.type === "x-www-form-urlencoded" && request.body.formUrlEncoded) {
    const params = new URLSearchParams();
    for (const p of request.body.formUrlEncoded) {
      if (p.enabled && p.key) {
        params.append(p.key, substituteVariables(p.value, variables));
      }
    }
    return params.toString();
  }
  return request.body.raw;
}

export async function sendRequest({
  request,
  proxyMode,
  variables,
  signal,
}: SendRequestOptions): Promise<ApiResponse> {
  const url = buildUrl(request, variables);
  const headers = buildHeaders(request, variables);
  const body = buildBody(request, variables);

  const startTime = performance.now();

  async function doFetch(fetchUrl: string, options: RequestInit): Promise<ApiResponse> {
    const response = await fetch(fetchUrl, options);
    const endTime = performance.now();

    if (proxyMode === "proxy" || proxyMode === "auto") {
      const contentType = response.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");

      if (isJson) {
        const proxyResponse = await response.json();
        return {
          status: proxyResponse.status ?? response.status,
          statusText: proxyResponse.statusText ?? response.statusText,
          headers: proxyResponse.headers ?? {},
          body: proxyResponse.body ?? "",
          time: proxyResponse.time ?? endTime - startTime,
          size: proxyResponse.size ?? 0,
          timestamp: new Date().toISOString(),
        };
      }

      const responseText = await response.text();
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      return {
        status: parseInt(response.headers.get("X-Original-Status") ?? String(response.status), 10),
        statusText: response.statusText,
        headers: responseHeaders,
        body: responseText,
        time: parseFloat(response.headers.get("X-Response-Time") ?? String(endTime - startTime)),
        size: new Blob([responseText]).size,
        timestamp: new Date().toISOString(),
      };
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseBody = await response.text();
    const size = new Blob([responseBody]).size;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      time: endTime - startTime,
      size,
      timestamp: new Date().toISOString(),
    };
  }

  if (proxyMode === "proxy") {
    return doFetch(`/api/proxy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({ method: request.method, url, headers, body }),
    });
  }

  if (proxyMode === "auto") {
    try {
      return await doFetch(url, {
        method: request.method,
        headers,
        signal,
        body: body && request.method !== "GET" && request.method !== "HEAD" ? body : undefined,
      });
    } catch {
      return doFetch(`/api/proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({ method: request.method, url, headers, body }),
      });
    }
  }

  return doFetch(url, {
    method: request.method,
    headers,
    signal,
    body: body && request.method !== "GET" && request.method !== "HEAD" ? body : undefined,
  });
}
