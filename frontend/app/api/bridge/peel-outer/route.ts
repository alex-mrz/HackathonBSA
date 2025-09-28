import { NextRequest, NextResponse } from "next/server";
import { peelOuterForSender } from "../../../../offchain/src/bridge";
import { getServerCommonConfig } from "@/lib/serverConfig";

type Payload = {
  recordId: string;
  outerIdBase64: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Payload>;
    if (!body.recordId || !body.outerIdBase64) {
      return NextResponse.json(
        { error: "recordId et outerIdBase64 sont requis" },
        { status: 400 },
      );
    }

    const cfg = getServerCommonConfig();
    const outerIdBytes = Uint8Array.from(
      Buffer.from(body.outerIdBase64, "base64"),
    );

    const innerCt = await peelOuterForSender({
      ...cfg,
      recordId: body.recordId,
      outerIdBytes,
    });

    return NextResponse.json({
      innerCiphertextBase64: Buffer.from(innerCt).toString("base64"),
    });
  } catch (error) {
    console.error("/api/bridge/peel-outer error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
