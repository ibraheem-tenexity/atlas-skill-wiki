'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { CheckCircle, XCircle, AlertTriangle, Loader2, Save, Eye, EyeOff } from 'lucide-react'
import type { ValidationResult } from '@/lib/validator'

// ─── Schema ──────────────────────────────────────────────────────────────────

const skillSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or fewer'),
  description: z.string().min(1, 'Description is required').max(500, 'Description must be 500 characters or fewer'),
  department: z.string().min(1, 'Department is required'),
  tags: z.string().optional(),
  visibility: z.enum(['public', 'internal', 'restricted']),
  body: z.string().min(1, 'SKILL.md body is required'),
})

type SkillFormValues = z.infer<typeof skillSchema>

// ─── Types ────────────────────────────────────────────────────────────────────

interface Department {
  id: string
  name: string
  slug: string
}

interface SkillEditorProps {
  /** If provided, populates the form for editing an existing skill */
  initialValues?: Partial<SkillFormValues>
  /** Heading to display above the editor */
  heading?: string
  /** Slug of the skill being edited (omit for new-skill flow) */
  existingSlug?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SkillEditor({ initialValues, heading = 'New Skill', existingSlug }: SkillEditorProps) {
  const router = useRouter()
  const [departments, setDepartments] = useState<Department[]>([])
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: '',
      description: '',
      department: '',
      tags: '',
      visibility: 'internal',
      body: '---\ntitle: \ndescription: \nversion: 0.1.0\n---\n\n## Overview\n\n\n## Usage\n\n\n## Examples\n\n',
      ...initialValues,
    },
  })

  const bodyValue = watch('body')

  // ── Fetch departments ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/departments')
      .then((r) => r.json())
      .then((data: Department[]) => setDepartments(data))
      .catch(() => setDepartments([]))
  }, [])

  // ── Unsaved changes guard ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // ── Validate ──────────────────────────────────────────────────────────────
  const handleValidate = useCallback(async () => {
    const values = watch()
    setIsValidating(true)
    setValidationResult(null)
    setPublishError(null)
    try {
      const res = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          description: values.description,
          department: values.department,
          body: values.body,
          existingSlug,
        }),
      })
      const data: ValidationResult = await res.json()
      setValidationResult(data)
    } catch {
      setValidationResult({
        status: 'failed',
        rules: [{
          id: 'network-error',
          label: 'Network error',
          severity: 'error',
          message: 'Validation request failed. Check your connection.',
        }],
      })
    } finally {
      setIsValidating(false)
    }
  }, [watch, existingSlug])

  // ── Save draft ────────────────────────────────────────────────────────────
  const handleSaveDraft = useCallback(async () => {
    const values = watch()
    setIsSavingDraft(true)
    try {
      await fetch('/api/skills/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
    } finally {
      setIsSavingDraft(false)
    }
  }, [watch])

  // ── Publish ───────────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (values) => {
    if (validationResult?.status === 'failed') return
    setIsPublishing(true)
    setPublishError(null)
    try {
      const res = await fetch('/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error('Publish failed')
      const data = await res.json()
      reset()
      router.push(`/skill/${data.slug}`)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'An error occurred while publishing.')
    } finally {
      setIsPublishing(false)
    }
  })

  // Publish is allowed when validation has run and didn't fail (passed or warn)
  const canPublish =
    validationResult !== null &&
    validationResult.status !== 'failed' &&
    !isValidating

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="category-label mb-2">Skill Registry</p>
        <h1 className="text-heading-lg font-semibold text-foreground">{heading}</h1>
        <p className="text-body-md text-muted-foreground mt-1">
          Fill in the metadata and body to register a new Claude Agent Skill.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <div className="flex gap-6 items-start">
          {/* ── Left: form fields ──────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── Metadata card ────────────────────────────────────────── */}
            <section
              className="rounded-lg border border-border bg-card p-6 space-y-4"
              aria-label="Skill metadata"
            >
              <h2 className="text-heading-sm font-semibold text-foreground">Metadata</h2>

              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="skill-name"
                  className="text-body-sm font-medium text-foreground"
                >
                  Name <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <input
                  id="skill-name"
                  type="text"
                  data-testid="skill-name-input"
                  aria-describedby={errors.name ? 'skill-name-error' : undefined}
                  aria-invalid={!!errors.name}
                  placeholder="e.g. code-reviewer"
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-focus transition-shadow duration-fast"
                  {...register('name')}
                />
                {errors.name && (
                  <p id="skill-name-error" role="alert" className="text-caption text-danger">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="skill-description"
                  className="text-body-sm font-medium text-foreground"
                >
                  Description <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="skill-description"
                  rows={3}
                  data-testid="skill-description-input"
                  aria-describedby={errors.description ? 'skill-description-error' : undefined}
                  aria-invalid={!!errors.description}
                  placeholder="Briefly describe what this skill does."
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-focus resize-y transition-shadow duration-fast"
                  {...register('description')}
                />
                {errors.description && (
                  <p id="skill-description-error" role="alert" className="text-caption text-danger">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label
                  htmlFor="skill-department"
                  className="text-body-sm font-medium text-foreground"
                >
                  Department <span className="text-danger" aria-hidden="true">*</span>
                </label>
                <select
                  id="skill-department"
                  data-testid="skill-department-select"
                  aria-describedby={errors.department ? 'skill-department-error' : undefined}
                  aria-invalid={!!errors.department}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-body-md text-foreground focus-visible:outline-none focus-visible:shadow-focus transition-shadow duration-fast"
                  {...register('department')}
                >
                  <option value="">Select a department…</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {errors.department && (
                  <p id="skill-department-error" role="alert" className="text-caption text-danger">
                    {errors.department.message}
                  </p>
                )}
              </div>

              {/* Tags + Visibility row */}
              <div className="grid grid-cols-2 gap-4">
                {/* Tags */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="skill-tags"
                    className="text-body-sm font-medium text-foreground"
                  >
                    Tags
                  </label>
                  <input
                    id="skill-tags"
                    type="text"
                    placeholder="ai, review, code (comma-separated)"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-body-md text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-focus transition-shadow duration-fast"
                    {...register('tags')}
                  />
                  <p className="text-caption text-muted-foreground">Comma-separated</p>
                </div>

                {/* Visibility */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="skill-visibility"
                    className="text-body-sm font-medium text-foreground"
                  >
                    Visibility
                  </label>
                  <select
                    id="skill-visibility"
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-2 text-body-md text-foreground focus-visible:outline-none focus-visible:shadow-focus transition-shadow duration-fast"
                    {...register('visibility')}
                  >
                    <option value="public">Public</option>
                    <option value="internal">Internal</option>
                    <option value="restricted">Restricted</option>
                  </select>
                </div>
              </div>
            </section>

            {/* ── Body editor card ─────────────────────────────────────── */}
            <section
              className="rounded-lg border border-border bg-card p-6 space-y-4"
              aria-label="SKILL.md body editor"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-heading-sm font-semibold text-foreground">SKILL.md Body</h2>
                <button
                  type="button"
                  onClick={() => setShowPreview((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-body-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-fast"
                  aria-pressed={showPreview}
                >
                  {showPreview ? (
                    <><EyeOff className="w-4 h-4" aria-hidden="true" /> Hide preview</>
                  ) : (
                    <><Eye className="w-4 h-4" aria-hidden="true" /> Show preview</>
                  )}
                </button>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="skill-body"
                  className="text-body-sm font-medium text-foreground sr-only"
                >
                  SKILL.md body content
                </label>
                <textarea
                  id="skill-body"
                  rows={20}
                  data-testid="skill-body-editor"
                  aria-describedby={errors.body ? 'skill-body-error' : 'skill-body-hint'}
                  aria-invalid={!!errors.body}
                  placeholder="---&#10;title: &#10;description: &#10;version: 0.1.0&#10;---&#10;&#10;## Overview&#10;&#10;## Usage&#10;"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm font-mono text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:shadow-focus resize-y transition-shadow duration-fast"
                  spellCheck={false}
                  {...register('body')}
                />
                <p id="skill-body-hint" className="text-caption text-muted-foreground">
                  Full SKILL.md content including YAML frontmatter.
                </p>
                {errors.body && (
                  <p id="skill-body-error" role="alert" className="text-caption text-danger">
                    {errors.body.message}
                  </p>
                )}
              </div>
            </section>

            {/* ── Validation status panel ──────────────────────────────── */}
            <div
              data-testid="validation-status"
              data-status={validationResult?.status ?? 'idle'}
              aria-live="polite"
              aria-atomic="true"
              className={[
                'rounded-lg border p-4 space-y-3 transition-colors duration-base',
                validationResult === null
                  ? 'border-border bg-card'
                  : validationResult.status === 'passed'
                  ? 'border-success bg-success/5'
                  : validationResult.status === 'warn'
                  ? 'border-warning bg-warning/5'
                  : 'border-danger bg-danger/5',
              ].join(' ')}
            >
              {isValidating ? (
                <p className="text-body-sm text-muted-foreground animate-pulse">Running validation…</p>
              ) : validationResult === null ? (
                <p className="text-body-sm text-muted-foreground">
                  Click <strong>Validate</strong> to check this skill against the governance rules.
                </p>
              ) : (
                <>
                  {/* Summary row */}
                  <div className="flex items-center gap-2">
                    {validationResult.status === 'passed' && (
                      <CheckCircle className="w-5 h-5 text-success shrink-0" aria-hidden="true" />
                    )}
                    {validationResult.status === 'warn' && (
                      <AlertTriangle className="w-5 h-5 text-warning shrink-0" aria-hidden="true" />
                    )}
                    {validationResult.status === 'failed' && (
                      <XCircle className="w-5 h-5 text-danger shrink-0" aria-hidden="true" />
                    )}
                    <span
                      className={[
                        'text-body-sm font-semibold',
                        validationResult.status === 'passed' ? 'text-success' : '',
                        validationResult.status === 'warn' ? 'text-warning' : '',
                        validationResult.status === 'failed' ? 'text-danger' : '',
                      ].join(' ')}
                    >
                      {validationResult.status === 'passed' && 'Validation passed'}
                      {validationResult.status === 'warn' && 'Validation passed with warnings'}
                      {validationResult.status === 'failed' && 'Validation failed'}
                    </span>
                  </div>

                  {/* Per-rule results */}
                  {validationResult.rules.length > 0 && (
                    <ul className="space-y-1.5" aria-label="Validation rule results">
                      {validationResult.rules.map((rule) => (
                        <li
                          key={rule.id}
                          data-rule-id={rule.id}
                          data-rule-severity={rule.severity}
                          className="flex items-start gap-2 text-body-sm"
                        >
                          {rule.severity === 'pass' && (
                            <CheckCircle className="w-4 h-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          {rule.severity === 'warn' && (
                            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          {rule.severity === 'error' && (
                            <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" aria-hidden="true" />
                          )}
                          <span>
                            <span className="font-medium">{rule.label}</span>
                            {rule.message && (
                              <span className="text-muted-foreground"> — {rule.message}</span>
                            )}
                            {rule.line !== undefined && (
                              <span className="ml-1 text-caption text-muted-foreground">(line {rule.line})</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>

            {/* ── Action buttons ────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
              {/* Validate button */}
              <button
                type="button"
                data-testid="validate-button"
                onClick={handleValidate}
                disabled={isValidating}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-body-sm font-medium text-foreground hover:bg-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Validating…</>
                ) : (
                  'Validate'
                )}
              </button>

              {/* Save draft button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-4 py-2 text-body-sm font-medium text-foreground hover:bg-muted transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDraft ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Saving…</>
                ) : (
                  <><Save className="w-4 h-4" aria-hidden="true" /> Save draft</>
                )}
              </button>

              {/* Publish button — gated on validation passing (or warn) */}
              <button
                type="submit"
                data-testid="publish-button"
                disabled={!canPublish || isPublishing}
                aria-disabled={!canPublish || isPublishing}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-body-sm font-medium text-primary-foreground hover:bg-brand-deep transition-colors duration-fast disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {isPublishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Publishing…</>
                ) : (
                  'Publish skill'
                )}
              </button>
            </div>

            {/* Publish error */}
            {publishError && (
              <div role="alert" className="rounded-md border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
                {publishError}
              </div>
            )}
          </div>

          {/* ── Right: live preview ────────────────────────────────────── */}
          {showPreview && (
            <aside
              className="w-96 shrink-0 sticky top-6 rounded-lg border border-border bg-card overflow-hidden"
              aria-label="Live markdown preview"
            >
              <div className="px-4 py-3 border-b border-border bg-muted/30">
                <p className="text-body-sm font-medium text-muted-foreground">Preview</p>
              </div>
              <div className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
                {bodyValue ? (
                  <div className="prose prose-sm max-w-none text-foreground [&_h1]:text-heading-md [&_h1]:font-semibold [&_h2]:text-heading-sm [&_h2]:font-semibold [&_h3]:text-body-lg [&_h3]:font-semibold [&_code]:font-mono [&_code]:text-body-sm [&_pre]:bg-muted [&_pre]:rounded-md [&_pre]:p-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_a]:text-primary [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {bodyValue}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-body-sm text-muted-foreground italic">
                    Start typing in the body editor to see a live preview.
                  </p>
                )}
              </div>
            </aside>
          )}
        </div>
      </form>
    </div>
  )
}
