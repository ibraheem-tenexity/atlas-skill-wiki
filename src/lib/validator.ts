import matter from 'gray-matter'
import { z } from 'zod'

export type RuleResult = {
  id: string
  label: string
  severity: 'error' | 'warn' | 'pass'
  message: string
  line?: number
}

export type ValidationResult = {
  status: 'passed' | 'warn' | 'failed'
  rules: RuleResult[]
}

const FrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  department: z.string().min(1),
})

export async function validateSkill(params: {
  name: string
  description: string
  department: string
  body: string
  existingSlug?: string // if editing; excluded from uniqueness check
  checkUniqueness?: (slug: string) => Promise<boolean>
}): Promise<ValidationResult> {
  const rules: RuleResult[] = []

  // Rule 1: Frontmatter schema
  try {
    const { data } = matter(params.body)
    const parsed = FrontmatterSchema.safeParse(data)
    if (parsed.success) {
      rules.push({ id: 'frontmatter-schema', label: 'Frontmatter schema', severity: 'pass', message: 'Frontmatter is valid' })
    } else {
      const errors = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      rules.push({ id: 'frontmatter-schema', label: 'Frontmatter schema', severity: 'error', message: `Invalid frontmatter: ${errors}`, line: 1 })
    }
  } catch {
    rules.push({ id: 'frontmatter-schema', label: 'Frontmatter schema', severity: 'error', message: 'Could not parse frontmatter', line: 1 })
  }

  // Rule 2: Required fields (name, description, department from form)
  if (!params.name || params.name.trim().length < 2) {
    rules.push({ id: 'required-name', label: 'Required: name', severity: 'error', message: 'Name is required and must be at least 2 characters' })
  } else {
    rules.push({ id: 'required-name', label: 'Required: name', severity: 'pass', message: 'Name present' })
  }
  if (!params.description || params.description.trim().length < 10) {
    rules.push({ id: 'required-description', label: 'Required: description', severity: 'error', message: 'Description is required (at least 10 chars)' })
  } else {
    rules.push({ id: 'required-description', label: 'Required: description', severity: 'pass', message: 'Description present' })
  }
  if (!params.department) {
    rules.push({ id: 'required-department', label: 'Required: department', severity: 'error', message: 'Department is required' })
  } else {
    rules.push({ id: 'required-department', label: 'Required: department', severity: 'pass', message: 'Department selected' })
  }

  // Rule 3: Name uniqueness
  if (params.name && params.name.trim().length > 0) {
    const slug = params.name.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    if (params.checkUniqueness && slug !== params.existingSlug) {
      const isDuplicate = await params.checkUniqueness(slug)
      if (isDuplicate) {
        rules.push({ id: 'name-uniqueness', label: 'Name uniqueness', severity: 'error', message: `A skill named "${params.name}" already exists (slug: ${slug})` })
      } else {
        rules.push({ id: 'name-uniqueness', label: 'Name uniqueness', severity: 'pass', message: 'Name is unique' })
      }
    } else {
      rules.push({ id: 'name-uniqueness', label: 'Name uniqueness', severity: 'pass', message: 'Name is unique' })
    }
  }

  // Rule 4: Description quality (heuristic)
  const desc = params.description || ''
  const hasVerb = /\b(summarizes|creates|generates|analyzes|extracts|processes|reviews|validates|compiles|transforms|converts|formats|sends|fetches|retrieves|updates|manages|monitors|tracks|reports|calculates)\b/i.test(desc)
  const hasMeaningfulLength = desc.trim().length >= 20
  const notPlaceholder = !/^(todo|tbd|placeholder|description here|add description|n\/a|none|empty)/i.test(desc.trim())
  if (!hasMeaningfulLength || !notPlaceholder) {
    rules.push({ id: 'description-quality', label: 'Description quality', severity: 'warn', message: 'Description should be descriptive (at least 20 chars, not a placeholder)' })
  } else if (!hasVerb) {
    rules.push({ id: 'description-quality', label: 'Description quality', severity: 'warn', message: 'Description should contain an action verb describing what the skill does' })
  } else {
    rules.push({ id: 'description-quality', label: 'Description quality', severity: 'pass', message: 'Description quality looks good' })
  }

  // Rule 5: Body content
  const bodyLines = params.body.split('\n')
  const hasHeading = bodyLines.some(l => l.startsWith('# '))
  if (!hasHeading) {
    rules.push({ id: 'body-structure', label: 'Body structure', severity: 'warn', message: 'SKILL.md body should start with a # Heading' })
  } else {
    rules.push({ id: 'body-structure', label: 'Body structure', severity: 'pass', message: 'Body has heading' })
  }

  // Determine overall status
  const hasErrors = rules.some(r => r.severity === 'error')
  const hasWarns = rules.some(r => r.severity === 'warn')
  const status = hasErrors ? 'failed' : hasWarns ? 'warn' : 'passed'

  return { status, rules }
}
