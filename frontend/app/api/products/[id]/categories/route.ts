import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const res = await fetch(`http://100.73.184.77:8020/products/${params.id}/categories`, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { detail: "Proxy error: " + (error as Error).message },
      { status: 502 }
    );
  }
}
