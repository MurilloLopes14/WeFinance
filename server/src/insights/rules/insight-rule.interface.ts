import { InsightDto } from '../dto/insight-response.dto';
import { InsightsContext } from '../insights.types';

export interface InsightRule {
  readonly key: string;
  evaluate(ctx: InsightsContext): InsightDto | InsightDto[] | null;
}
