import type { Metadata } from "next";
import { PlanProjectsApp } from "./projects-app";
import "./plan-electric.css";

export const metadata: Metadata = {
  title: "Plan Electric · Frizeo Oferte",
  description: "Propuneri de instalații electrice pe planuri arhitecturale.",
};

export default function PlanElectricPage() {
  return <PlanProjectsApp />;
}
