import { Building2 } from "lucide-react";

export default function DepartmentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Departments</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          View skills organized by department.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <Building2 className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-md font-medium text-foreground">No departments yet</p>
          <p className="text-body-sm text-muted-foreground">
            Departments will appear here once skills are assigned to them.
          </p>
        </div>
      </div>
    </div>
  );
}
