import { spawn } from "node:child_process";
import { once } from "node:events";
import { resolve } from "node:path";

export type VoteTokenResult = {
  person_id: string;
  person_name: string;
  vote: number;
  token: string;
  payload_hash: string;
  nonce: string;
};

export async function generateVoteToken(params: {
  identifier: string;
  vote: number;
  name?: string;
  randomBytes?: number;
}): Promise<VoteTokenResult> {
  const scriptPath = resolve(process.cwd(), "..", "vote_tokens.py");
  const args = [
    scriptPath,
    "--identifier",
    params.identifier,
    "--vote",
    String(params.vote),
    "--json",
  ];

  if (params.name) {
    args.push("--name", params.name);
  }
  if (params.randomBytes) {
    args.push("--random-bytes", String(params.randomBytes));
  }

  const python = process.env.PYTHON_BIN || "python3";
  const child = spawn(python, args, {
    cwd: resolve(process.cwd(), ".."),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf-8");
  child.stderr.setEncoding("utf-8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  const [code] = (await once(child, "close")) as [number | null];

  if (code !== 0) {
    throw new Error(`vote_tokens.py failed (code ${code}): ${stderr || stdout}`);
  }

  try {
    return JSON.parse(stdout) as VoteTokenResult;
  } catch (err) {
    throw new Error(`Impossible de parser la sortie JSON de vote_tokens.py: ${err}`);
  }
}
