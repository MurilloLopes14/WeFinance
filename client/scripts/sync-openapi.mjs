import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const swaggerUrl =
  process.env.SWAGGER_URL ?? 'http://localhost:3000/docs-json'
const outputPath = resolve(process.cwd(), 'openapi.json')

const response = await fetch(swaggerUrl)

if (!response.ok) {
  console.error(
    `Failed to fetch OpenAPI spec from ${swaggerUrl} (status ${response.status}).`,
  )
  console.error('Make sure the NestJS server is running with SWAGGER_ENABLED=true.')
  process.exit(1)
}

const spec = await response.json()
writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8')

console.log(`OpenAPI spec saved to ${outputPath}`)
