export interface McpToolContext {
  /** UUID of the WeFinance user the MCP tools act as (MCP_USER_ID) */
  userId: string;
  /**
   * UUID of the household the MCP tools default to, taken from the
   * `?household=` query string on the connector URL. Mutable per-session:
   * re-read on every request so a client can switch households without reconnecting.
   */
  householdId?: string;
}
