import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { method, url, headers: customHeaders, body: requestBody } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let targetUrl: string;
    try {
      targetUrl = new URL(url).toString();
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const fetchHeaders: Record<string, string> = { ...customHeaders };
    delete fetchHeaders["host"];
    delete fetchHeaders["origin"];
    delete fetchHeaders["referer"];

    const fetchOptions: RequestInit = {
      method: method || "GET",
      headers: fetchHeaders,
      redirect: "follow",
    };

    if (requestBody && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = requestBody;
    }

    const startTime = performance.now();
    const response = await fetch(targetUrl, fetchOptions);
    const headerTime = performance.now();

    const contentType = response.headers.get("content-type") ?? "";
    const isStreamable =
      contentType.includes("text/event-stream") ||
      contentType.includes("application/octet-stream") ||
      contentType.includes("video/") ||
      contentType.includes("audio/");

    if (isStreamable) {
      const reader = response.body?.getReader();
      if (!reader) {
        return NextResponse.json({ error: "No response body" }, { status: 500 });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const endTime = performance.now();

      const stream = new ReadableStream({
        async start(controller) {
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              controller.enqueue(encoder.encode(text));
            }
          } catch (error) {
            controller.error(error);
          } finally {
            controller.close();
          }
        },
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "X-Original-Status": String(response.status),
          "X-Response-Time": String(endTime - startTime),
          "X-Proxy-TTFB": String(headerTime - startTime),
        },
      });
    }

    const responseText = await response.text();
    const bodyTime = performance.now();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const total = bodyTime - startTime;
    const ttfb = headerTime - startTime;
    const download = bodyTime - headerTime;

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      time: total,
      size: new Blob([responseText]).size,
      timing: {
        dnsLookup: 0,
        tcpConnect: 0,
        tlsHandshake: 0,
        ttfb: Math.round(ttfb),
        download: Math.round(download),
        total: Math.round(total),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
