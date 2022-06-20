import type { NextApiHandler } from "next";

import { readAssetList } from "~/lib/utils";
import withCorsMiddleware from "~/lib/withCorsMiddleware";

const VALID_NETWORKS = ["ethereum", "sifchain"];
const VALID_ENVS = ["localnet", "devnet", "testnet", "mainnet"];

const handler: NextApiHandler = async (req, res) => {
  try {
    const { network, env } = req.query;

    if (typeof network !== "string" || !VALID_NETWORKS.includes(network)) {
      res.statusCode = 400;
      throw new Error(`Invalid network: ${network}`);
    }

    if (typeof env !== "string" || !VALID_ENVS.includes(env)) {
      res.statusCode = 400;
      throw new Error(`Invalid env: ${env}`);
    }

    const { assets } = await readAssetList(network, env);

    res.json(assets);
  } catch (error) {
    if (error instanceof Error) {
      res.status(res.statusCode ?? 400).send({
        message: `Failed to process request: ${error.message}`,
      });
    } else {
      res.status(res.statusCode ?? 500).send({
        message: `Failed to process request: unknown error`,
        originalError: error,
      });
    }
  }
};

export default withCorsMiddleware(handler);