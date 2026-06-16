/**
 * Typed storage interface for Atlas.
 * All database access goes through this module — callers never import from @prisma/client directly.
 */
import { prisma } from '@/lib/db'
import type {
  Skill,
  SkillVersion,
  Department,
  User,
  Connection,
  Deployment,
  AuditLog,
  Policy,
  Prisma,
  GovernanceStatus,
  Visibility,
  ConnectionType,
  VersionStatus,
  Surface,
} from '@prisma/client'

// ─── Re-export types so callers import from @/lib/storage ─────────────────────
export type {
  Skill,
  SkillVersion,
  Department,
  User,
  Connection,
  Deployment,
  AuditLog,
  Policy,
  GovernanceStatus,
  Visibility,
  ConnectionType,
  VersionStatus,
  Surface,
}

// ─── SkillStore ───────────────────────────────────────────────────────────────

export const SkillStore = {
  /** List all skills, optionally filtering by department or governance status. */
  async list(opts?: {
    departmentId?: string
    governanceStatus?: GovernanceStatus
    visibility?: Visibility
    tags?: string[]
  }): Promise<Skill[]> {
    const where: Prisma.SkillWhereInput = {}
    if (opts?.departmentId) where.departmentId = opts.departmentId
    if (opts?.governanceStatus) where.governanceStatus = opts.governanceStatus
    if (opts?.visibility) where.visibility = opts.visibility
    if (opts?.tags?.length) where.tags = { hasSome: opts.tags }
    return prisma.skill.findMany({ where, orderBy: { updatedAt: 'desc' } })
  },

  /** Find a skill by its unique slug. */
  async getBySlug(slug: string): Promise<Skill | null> {
    return prisma.skill.findUnique({ where: { slug } })
  },

  /** Find a skill by its id. */
  async getById(id: string): Promise<Skill | null> {
    return prisma.skill.findUnique({ where: { id } })
  },

  /** Create a new skill. */
  async create(data: Prisma.SkillCreateInput): Promise<Skill> {
    return prisma.skill.create({ data })
  },

  /** Update skill fields. */
  async update(id: string, data: Prisma.SkillUpdateInput): Promise<Skill> {
    return prisma.skill.update({ where: { id }, data })
  },

  /** Delete a skill and cascade-delete its versions, connections, deployments. */
  async delete(id: string): Promise<Skill> {
    return prisma.skill.delete({ where: { id } })
  },

  /** List all versions for a skill. */
  async listVersions(skillId: string): Promise<SkillVersion[]> {
    return prisma.skillVersion.findMany({
      where: { skillId },
      orderBy: { date: 'desc' },
    })
  },

  /** Create a new version snapshot. */
  async createVersion(data: Prisma.SkillVersionCreateInput): Promise<SkillVersion> {
    return prisma.skillVersion.create({ data })
  },

  /** Get a single version by id. */
  async getVersion(id: string): Promise<SkillVersion | null> {
    return prisma.skillVersion.findUnique({ where: { id } })
  },

  /** Update version status (e.g. publish or archive). */
  async updateVersionStatus(id: string, status: VersionStatus): Promise<SkillVersion> {
    return prisma.skillVersion.update({ where: { id }, data: { status } })
  },

  /** List connections from/to a skill. */
  async listConnections(skillId: string): Promise<Connection[]> {
    return prisma.connection.findMany({
      where: { OR: [{ fromSkillId: skillId }, { toSkillId: skillId }] },
    })
  },

  /** Create a directed connection between two skills. */
  async createConnection(data: Prisma.ConnectionCreateInput): Promise<Connection> {
    return prisma.connection.create({ data })
  },

  /** Delete a connection by id. */
  async deleteConnection(id: string): Promise<Connection> {
    return prisma.connection.delete({ where: { id } })
  },

  /** List deployments for a skill. */
  async listDeployments(skillId: string): Promise<Deployment[]> {
    return prisma.deployment.findMany({ where: { skillId }, orderBy: { createdAt: 'desc' } })
  },

  /** Record a new deployment. */
  async createDeployment(data: Prisma.DeploymentCreateInput): Promise<Deployment> {
    return prisma.deployment.create({ data })
  },
}

// ─── DepartmentStore ──────────────────────────────────────────────────────────

export const DepartmentStore = {
  /** List all departments. */
  async list(): Promise<Department[]> {
    return prisma.department.findMany({ orderBy: { name: 'asc' } })
  },

  /** Find a department by slug. */
  async getBySlug(slug: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { slug } })
  },

  /** Find a department by id. */
  async getById(id: string): Promise<Department | null> {
    return prisma.department.findUnique({ where: { id } })
  },

  /** Create a department. */
  async create(data: Prisma.DepartmentCreateInput): Promise<Department> {
    return prisma.department.create({ data })
  },

  /** Update a department. */
  async update(id: string, data: Prisma.DepartmentUpdateInput): Promise<Department> {
    return prisma.department.update({ where: { id }, data })
  },

  /** Delete a department. */
  async delete(id: string): Promise<Department> {
    return prisma.department.delete({ where: { id } })
  },
}

// ─── UserStore ────────────────────────────────────────────────────────────────

export const UserStore = {
  /** Find a user by email (used by NextAuth credentials provider). */
  async getByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } })
  },

  /** Find a user by id. */
  async getById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } })
  },

  /** Create a user. */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return prisma.user.create({ data })
  },

  /** Update a user. */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({ where: { id }, data })
  },
}

// ─── AuditStore ───────────────────────────────────────────────────────────────

export const AuditStore = {
  /** Append an audit log entry. */
  async log(data: {
    actorId: string
    action: string
    targetType: string
    targetId: string
    skillId?: string
    metadata?: Record<string, unknown>
  }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        actorId: data.actorId,
        action: data.action,
        targetType: data.targetType,
        targetId: data.targetId,
        skillId: data.skillId ?? null,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  },

  /** List audit logs for a specific skill, most recent first. */
  async listForSkill(skillId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { skillId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  },

  /** List audit logs for a specific actor. */
  async listForActor(actorId: string, limit = 50): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    })
  },

  /** List all audit logs with optional pagination. */
  async list(opts?: { skip?: number; take?: number }): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      skip: opts?.skip,
      take: opts?.take ?? 100,
    })
  },
}

// ─── PolicyStore ──────────────────────────────────────────────────────────────

export const PolicyStore = {
  /** Get the single governance policy record (there is only one). */
  async get(): Promise<Policy | null> {
    const policies = await prisma.policy.findMany({ take: 1 })
    return policies[0] ?? null
  },

  /** Create or replace the policy. */
  async upsert(data: {
    requiredFields: string[]
    allowedDepartments: string[]
    reviewSlaDays: number
    updatedById?: string
  }): Promise<Policy> {
    const existing = await PolicyStore.get()
    if (existing) {
      return prisma.policy.update({ where: { id: existing.id }, data })
    }
    return prisma.policy.create({ data })
  },
}
