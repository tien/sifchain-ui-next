# @sifchain/sif-api

HTTP client for sifchain Vanir data aggregation service

OpenAPI spec: [https://data.sifchain.finance](https://data.sifchain.finance)

## Installation

```sh
yarn add @sifchain/stargate@snapshot
```

## Example usage

```ts
import { createClient } from '@sifchain/sif-api';

const vanirClient = createClient();

const tokenStats = await vanirClient.assets.getTokenStats();
```
