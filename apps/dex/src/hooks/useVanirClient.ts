import { useQuery } from "react-query";
import { useDexEnvironment } from "~/domains/core/envs";

import { createClient } from "~/lib/vanir";

export default function useQueryClient() {
  const { data: env, isSuccess } = useDexEnvironment();

  return useQuery(
    ["sif-vanir-client", env?.kind],
    () => {
      console.log("creating client", env?.vanirUrl);
      if (!env) return;

      return createClient(env.vanirUrl);
    },
    {
      enabled: isSuccess && typeof env?.vanirUrl === "string",
    },
  );
}
