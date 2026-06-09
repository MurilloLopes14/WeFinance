/// <reference types="node" />

import { defineConfig } from 'orval'

/** Local spec from `npm run api:sync`, or live Swagger via SWAGGER_URL. */
const swaggerUrl = process.env.SWAGGER_URL ?? './openapi.json'

export default defineConfig({
  wefinance: {
    input: {
      target: swaggerUrl,
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/models',
      client: 'react-query',
      clean: true,
      override: {
        mutator: {
          path: './src/api/axios-instance.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true,
          version: 5,
          queryOptions: {
            path: './src/api/default-query-options.ts',
            name: 'defaultQueryOptions',
          },
        },
      },
    },
  },
})
