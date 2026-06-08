import { existsSync } from 'node:fs'
import { defineConfig } from 'orval'

const localSpec = './openapi.json'
const swaggerUrl =
  process.env.SWAGGER_URL ??
  (existsSync(localSpec) ? localSpec : 'http://localhost:3000/docs-json')

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
          options: {
            staleTime: 60_000,
            gcTime: 300_000,
            retry: 1,
          },
        },
      },
    },
  },
})
