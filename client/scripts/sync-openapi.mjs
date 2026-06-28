import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const swaggerUrl =
  process.env.SWAGGER_URL ?? 'http://localhost:2951/docs-json'
const outputPath = resolve(process.cwd(), 'openapi.json')

let response

try {
  response = await fetch(swaggerUrl)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to fetch OpenAPI spec from ${swaggerUrl}.`)
  console.error(message)
  console.error('')
  console.error('Start the NestJS server first (e.g. npm run start:dev in server/).')
  console.error('Swagger must be enabled (SWAGGER_ENABLED=true).')
  console.error('Override the URL with SWAGGER_URL if your server uses a different port.')
  process.exit(1)
}

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
