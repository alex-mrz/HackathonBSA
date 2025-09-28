import { NextRequest, NextResponse } from "next/server";
import { decryptInnerForSender } from "../../../../offchain/src/bridge";
import { getServerCommonConfig } from "@/lib/serverConfig";

type Payload = {
  recordId: string;
  innerIdBase64: string;
  innerCiphertextBase64: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<Payload>;
    if (!body.recordId || !body.innerIdBase64 || !body.innerCiphertextBase64) {
      return NextResponse.json(
        {
          error: "recordId, innerIdBase64 et innerCiphertextBase64 sont requis",
        },
        { status: 400 },
      );
    }

    const cfg = getServerCommonConfig();
    const innerIdBytes = Uint8Array.from(
      Buffer.from(body.innerIdBase64, "base64"),
    );
    const innerCt = Uint8Array.from(
      Buffer.from(body.innerCiphertextBase64, "base64"),
    );

    const plaintextBytes = await decryptInnerForSender({
      ...cfg,
      recordId: body.recordId,
      innerIdBytes,
      innerCt,
    });

    const plaintextBase64 = Buffer.from(plaintextBytes).toString("base64");
    const plaintextUtf8 = Buffer.from(plaintextBytes).toString("utf-8");

    return NextResponse.json({ plaintextBase64, plaintextUtf8 });
  } catch (error) {
    console.error("/api/bridge/decrypt-inner error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
