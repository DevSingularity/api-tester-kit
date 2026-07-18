import type { ApiRequest } from "@/types";

function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
}

export function generateCurl(request: ApiRequest): string {
  const parts = [`curl -X ${request.method}`];

  for (const header of request.headers) {
    if (header.enabled && header.key) {
      parts.push(`-H "${escapeString(header.key)}: ${escapeString(header.value)}"`);
    }
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    parts.push(`-H "Authorization: Bearer ${escapeString(request.auth.bearer.token)}"`);
  }

  if (request.auth.type === "basic" && request.auth.basic) {
    parts.push(
      `-u "${escapeString(request.auth.basic.username)}:${escapeString(request.auth.basic.password)}"`
    );
  }

  if (request.body.type !== "none" && request.body.raw) {
    parts.push(`-d '${escapeString(request.body.raw)}'`);
  }

  parts.push(`"${request.url}"`);

  return parts.join(" \\\n  ");
}

export function generateJavaScript(request: ApiRequest): string {
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers["Authorization"] = `Bearer ${request.auth.bearer.token}`;
  }

  const options: string[] = [];
  options.push(`  method: '${request.method}'`);
  options.push(
    `  headers: ${JSON.stringify(headers, null, 2).split("\n").join("\n  ")}`
  );

  if (request.body.type !== "none" && request.body.raw) {
    options.push(`  body: JSON.stringify(${request.body.raw})`);
  }

  return `fetch('${request.url}', {
${options.join(",\n")}
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`;
}

export function generatePython(request: ApiRequest): string {
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers["Authorization"] = `Bearer ${request.auth.bearer.token}`;
  }

  let code = `import requests\n\n`;
  code += `url = "${request.url}"\n`;
  code += `headers = ${JSON.stringify(headers, null, 4)}\n`;

  if (request.body.type !== "none" && request.body.raw) {
    code += `payload = ${request.body.raw}\n`;
    code += `\nresponse = requests.${request.method.toLowerCase()}(url, headers=headers, json=payload)\n`;
  } else {
    code += `\nresponse = requests.${request.method.toLowerCase()}(url, headers=headers)\n`;
  }

  code += `print(response.status_code)\nprint(response.json())`;

  return code;
}

export function generateGo(request: ApiRequest): string {
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers["Authorization"] = `Bearer ${request.auth.bearer.token}`;
  }

  let code = `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n\t"io"\n`;

  if (request.body.type !== "none" && request.body.raw) {
    code += `\t"strings"\n`;
  }

  code += `)\n\nfunc main() {\n`;

  if (request.body.type !== "none" && request.body.raw) {
    code += `\tbody := strings.NewReader(\`${request.body.raw}\`)\n`;
    code += `\treq, _ := http.NewRequest("${request.method}", "${request.url}", body)\n`;
  } else {
    code += `\treq, _ := http.NewRequest("${request.method}", "${request.url}", nil)\n`;
  }

  for (const [key, value] of Object.entries(headers)) {
    code += `\treq.Header.Set("${key}", "${value}")\n`;
  }

  code += `\n\tresp, _ := http.DefaultClient.Do(req)\n`;
  code += `\tdefer resp.Body.Close()\n`;
  code += `\trespBody, _ := io.ReadAll(resp.Body)\n`;
  code += `\tfmt.Println(string(respBody))\n`;
  code += `}`;

  return code;
}

export function generateTypeScript(request: ApiRequest): string {
  const headers: Record<string, string> = {};
  for (const h of request.headers) {
    if (h.enabled && h.key) headers[h.key] = h.value;
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers["Authorization"] = `Bearer ${request.auth.bearer.token}`;
  }

  let code = `interface Response {\n  status: number;\n  data: unknown;\n}\n\n`;
  code += `async function fetchData(): Promise<Response> {\n`;
  code += `  const response = await fetch('${request.url}', {\n`;
  code += `    method: '${request.method}',\n`;
  code += `    headers: ${JSON.stringify(headers, null, 4).split("\n").join("\n    ")},\n`;

  if (request.body.type !== "none" && request.body.raw) {
    code += `    body: JSON.stringify(${request.body.raw}),\n`;
  }

  code += `  });\n\n`;
  code += `  const data = await response.json();\n`;
  code += `  return { status: response.status, data };\n`;
  code += `}\n\n`;
  code += `fetchData().then(console.log);`;

  return code;
}

export function generatePHP(request: ApiRequest): string {
  let code = `<?php\n\n$ch = curl_init();\n`;
  code += `curl_setopt($ch, CURLOPT_URL, "${request.url}");\n`;
  code += `curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);\n`;
  code += `curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "${request.method}");\n\n`;

  const headers: string[] = [];
  for (const h of request.headers) {
    if (h.enabled && h.key) headers.push(`${h.key}: ${h.value}`);
  }

  if (request.auth.type === "bearer" && request.auth.bearer?.token) {
    headers.push(`Authorization: Bearer ${request.auth.bearer.token}`);
  }

  if (headers.length > 0) {
    code += `curl_setopt($ch, CURLOPT_HTTPHEADER, [\n`;
    for (const h of headers) {
      code += `    '${h}',\n`;
    }
    code += `]);\n`;
  }

  if (request.body.type !== "none" && request.body.raw) {
    code += `\ncurl_setopt($ch, CURLOPT_POSTFIELDS, '${request.body.raw}');\n`;
  }

  code += `\n$response = curl_exec($ch);\n$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);\ncurl_close($ch);\n\n`;
  code += `echo "Status: " . $httpCode . "\\n";\necho $response;`;

  return code;
}

export type CodeLanguage =
  | "curl"
  | "javascript"
  | "typescript"
  | "python"
  | "go"
  | "php";

export const CODE_LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: "curl", label: "cURL" },
  { value: "javascript", label: "JavaScript (Fetch)" },
  { value: "typescript", label: "TypeScript (Fetch)" },
  { value: "python", label: "Python (Requests)" },
  { value: "go", label: "Go (net/http)" },
  { value: "php", label: "PHP (cURL)" },
];

export function generateCode(
  request: ApiRequest,
  language: CodeLanguage
): string {
  switch (language) {
    case "curl":
      return generateCurl(request);
    case "javascript":
      return generateJavaScript(request);
    case "typescript":
      return generateTypeScript(request);
    case "python":
      return generatePython(request);
    case "go":
      return generateGo(request);
    case "php":
      return generatePHP(request);
    default:
      return generateCurl(request);
  }
}
