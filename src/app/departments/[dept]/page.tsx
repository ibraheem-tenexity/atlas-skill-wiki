interface DepartmentPageProps {
  params: { dept: string };
}

export default function DepartmentPage({ params }: DepartmentPageProps) {
  const deptName = params.dept
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="space-y-6">
      <div>
        <p className="category-label mb-2">Department</p>
        <h1 className="text-heading-lg font-semibold text-foreground">{deptName}</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-body-md text-muted-foreground">
          Department skill listing coming soon.
        </p>
      </div>
    </div>
  );
}
