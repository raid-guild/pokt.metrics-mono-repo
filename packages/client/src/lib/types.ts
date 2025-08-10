// Global type definitions for the client application

// Recharts ActiveShapeProps type definition
export interface ActiveShapeProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: unknown[];
  percent?: number;
  value?: number;
  index?: number;
}
