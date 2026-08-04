import type { Metadata } from "next";
import { PlanEditorApp } from "./editor-app";
import "../plan-electric.css";

export const metadata: Metadata = {
  title: "Editor Plan Electric · Frizeo Oferte",
};

export default async function PlanEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PlanEditorApp projectId={id} />;
}
