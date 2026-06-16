interface SkillPageProps {
  params: { slug: string };
}

export default function SkillPage({ params }: SkillPageProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <p className="category-label mb-2">Skill</p>
        <h1 className="text-heading-lg font-semibold text-foreground">{params.slug}</h1>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <p className="text-body-md text-muted-foreground">
          Skill detail view coming soon.
        </p>
      </div>
    </div>
  );
}
