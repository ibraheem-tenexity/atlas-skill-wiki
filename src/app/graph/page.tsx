import { Network } from "lucide-react";

export default function GraphPage() {
  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Connection Graph</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Visualize relationships between skills and their dependencies.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-sunken min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-center">
          <Network className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-md font-medium text-foreground">Graph coming soon</p>
          <p className="text-body-sm text-muted-foreground">
            The skill connection graph will render here using ReactFlow.
          </p>
        </div>
      </div>
    </div>
  );
}
