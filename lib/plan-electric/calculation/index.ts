export type {
  AccessoryTotal,
  CalculationConfig,
  CalculationContribution,
  CalculationContext,
  CalculationResult,
  CalculationRule,
  CableTypeTotal,
  CircuitSummary,
  DeviceTypeTotal,
  MaterialLine,
  RouteSegment,
  RoutingMode,
} from "./types";

export {
  mergeCalculationConfig,
  registerCalculationRule,
  runCalculationEngine,
} from "./engine";

export { defaultMountingHeightM, resolveMountingHeightM } from "./heights";
export { horizontalMeters, pixelDistance } from "./geometry";
