import { ShieldCheck } from "lucide-react";

export default function GovernancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Governance</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Review and approve skills awaiting governance sign-off.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <ShieldCheck className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-md font-medium text-foreground">Nothing pending review</p>
          <p className="text-body-sm text-muted-foreground">
            Skills awaiting approval will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
