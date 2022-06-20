import Cors, { type CorsOptions } from "cors";
import type { NextApiHandler } from "next";
import initMiddleware from "./initMiddleware";

const DEFAULT_CORS_OPTIONS: CorsOptions = {
  methods: ["GET", "OPTIONS"],
  origin: "*",
};

export default function withCorsMiddleware(
  handler: NextApiHandler,
  options = DEFAULT_CORS_OPTIONS,
): NextApiHandler {
  const corsMiddleware = initMiddleware(Cors(options));

  return async (req, res) => {
    try {
      await corsMiddleware(req, res);
      await handler(req, res);
    } catch (error) {
      if (error instanceof Error) {
        res.status(res.statusCode ?? 400).send({
          message: `Failed to run middleware: ${error.message}`,
        });
      } else {
        res.status(res.statusCode ?? 500).send({
          message: `Failed to run middleware: unknown error`,
          originalError: error,
        });
      }
    }
  };
}
