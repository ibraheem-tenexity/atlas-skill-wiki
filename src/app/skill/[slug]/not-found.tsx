import Link from 'next/link'

export default function SkillNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <p className="category-label">404</p>
      <h1 className="text-heading-lg font-semibold text-foreground">Skill not found</h1>
      <p className="text-body-md text-muted-foreground max-w-sm">
        The skill you are looking for does not exist or may have been removed.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground hover:bg-brand-deep transition-colors duration-fast"
      >
        Back to Catalog
      </Link>
    </div>
  )
}
