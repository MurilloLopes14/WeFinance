import { McpToolContext } from '../tool-context.type';

/**
 * Resolves which household a tool call should act on: the explicit `householdId`
 * argument if the model provided one, otherwise the one configured via the
 * `?household=` query string on the connector URL.
 */
export function resolveHouseholdId(
  ctx: McpToolContext,
  provided?: string,
): string {
  const householdId = provided ?? ctx.householdId;

  if (!householdId) {
    throw new Error(
      'householdId não informado. Adicione ?household=<uuid> na URL do conector MCP ou passe householdId explicitamente.',
    );
  }

  return householdId;
}
