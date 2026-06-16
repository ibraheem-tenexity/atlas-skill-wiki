import { SkillEditor } from '@/components/skill-editor'

interface EditSkillPageProps {
  params: { slug: string }
}

export default function EditSkillPage({ params }: EditSkillPageProps) {
  return (
    <SkillEditor
      heading={`Edit: ${params.slug}`}
      existingSlug={params.slug}
    />
  )
}
