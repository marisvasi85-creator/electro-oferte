import type { Metadata, Viewport } from "next";
import { PlanProjectsApp } from "./projects-app";
import "./plan-electric.css";

export const metadata: Metadata = {
  title: "Plan Electric · Frizeo Oferte",
  description: "Propuneri de instalații electrice pe planuri arhitecturale.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function PlanElectricPage() {
  return <PlanProjectsApp />;
}
