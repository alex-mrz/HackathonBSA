import { NextRequest, NextResponse } from "next/server";
import { doubleEncryptAndStoreToSender } from "../../../../offchain/src/bridge";
import { generateVoteToken } from "@/lib/runVoteToken";
import { getServerCommonConfig } from "@/lib/serverConfig";
import { Hex } from "@mysten/sui/utils";

type VotePayload = {
  voteValue: number;
  personId: string;
  personName?: string;
  walletAddress: Hex;
};

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<VotePayload>;
    if (
      body.voteValue === undefined ||
      body.personId === undefined ||
      body.walletAddress === undefined
    ) {
      return NextResponse.json(
        {
          error: "voteValue, personId et walletAddress sont requis",
        },
        { status: 400 },
      );
    }

    const { voteValue, personId, personName, walletAddress } = body as VotePayload;

    const tokenResult = await generateVoteToken({
      identifier: personId,
      name: personName,
      vote: voteValue,
    });

    const cfg = getServerCommonConfig();

    const doubleSeal = await doubleEncryptAndStoreToSender({
      ...cfg,
      sender: walletAddress,
      tokenUtf8: tokenResult.token,
    });

    return NextResponse.json({
      token: tokenResult,
      doubleSeal: {
        digest: doubleSeal.digest,
        recordId: doubleSeal.recordId,
        innerIdBase64: toBase64(doubleSeal.innerId),
        outerIdBase64: toBase64(doubleSeal.outerId),
        plainHashBase64: toBase64(doubleSeal.plainHash),
      },
    });
  } catch (error) {
    console.error("/api/vote error", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
