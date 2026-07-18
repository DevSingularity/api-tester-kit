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
    const endTime = performance.now();

    const responseText = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return NextResponse.json({
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseText,
      time: endTime - startTime,
      size: new Blob([responseText]).size,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
