import { BookOpen } from "lucide-react";

export default function CatalogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-heading-lg font-semibold text-foreground">Skill Catalog</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Browse and discover all Claude Agent Skills in your organization.
        </p>
      </div>

      <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-sunken py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <BookOpen className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
          <p className="text-body-md font-medium text-foreground">No skills yet</p>
          <p className="text-body-sm text-muted-foreground">
            Skills will appear here once they are added to the registry.
          </p>
        </div>
      </div>
    </div>
  );
}
