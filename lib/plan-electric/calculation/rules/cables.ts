import { buildCircuitRoutes } from "../routing";
import type { CalculationContribution, CalculationRule } from "../types";

/**
 * Cable rule: builds logical routes from catalog circuit/cableType metadata.
 * Future rules (voltage drop, conductor sizing) can consume the same segments.
 */
export const cableRoutesRule: CalculationRule = {
  id: "cables.routes",
  name: "Trasee cablu pe circuite",
  apply(ctx): CalculationContribution {
    const { segments, diagnostics } = buildCircuitRoutes(ctx.symbols, ctx.config, ctx.catalog);
    return { segments, diagnostics };
  },
};
