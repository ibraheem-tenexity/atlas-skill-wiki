-- Atlas Skill Wiki - Initial Schema Migration
-- Ticket 2: 8 entities + 6 enums

-- Enums
CREATE TYPE "Role" AS ENUM ('skill.author', 'dept.lead', 'gov.admin', 'agent.builder', 'reader');
CREATE TYPE "Visibility" AS ENUM ('public', 'internal', 'restricted');
CREATE TYPE "GovernanceStatus" AS ENUM ('Draft', 'InReview', 'Approved', 'Deprecated');
CREATE TYPE "ConnectionType" AS ENUM ('depends-on', 'supersedes', 'related-to');
CREATE TYPE "VersionStatus" AS ENUM ('draft', 'published', 'archived');
CREATE TYPE "Surface" AS ENUM ('claude-code', 'web-agent', 'slack-bot');

-- Department (no foreign key deps besides self-ref via User)
CREATE TABLE "Department" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL UNIQUE,
  "slug"        TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "leadId"      TEXT,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User
CREATE TABLE "User" (
  "id"           TEXT NOT NULL PRIMARY KEY,
  "email"        TEXT NOT NULL UNIQUE,
  "name"         TEXT NOT NULL,
  "password"     TEXT NOT NULL,
  "role"         "Role" NOT NULL DEFAULT 'reader',
  "departmentId" TEXT,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "User_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Department lead FK (circular ref resolved after User table)
ALTER TABLE "Department" ADD CONSTRAINT "Department_leadId_fkey"
  FOREIGN KEY ("leadId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Skill
CREATE TABLE "Skill" (
  "id"               TEXT NOT NULL PRIMARY KEY,
  "name"             TEXT NOT NULL,
  "slug"             TEXT NOT NULL UNIQUE,
  "description"      TEXT NOT NULL,
  "departmentId"     TEXT NOT NULL,
  "tags"             TEXT[] NOT NULL DEFAULT '{}',
  "visibility"       "Visibility" NOT NULL DEFAULT 'internal',
  "currentVersion"   TEXT NOT NULL DEFAULT '1.0.0',
  "governanceStatus" "GovernanceStatus" NOT NULL DEFAULT 'Draft',
  "ownerId"          TEXT NOT NULL,
  "frontmatter"      JSONB NOT NULL DEFAULT '{}',
  "body"             TEXT NOT NULL DEFAULT '',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Skill_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Skill_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- SkillVersion
CREATE TABLE "SkillVersion" (
  "id"                  TEXT NOT NULL PRIMARY KEY,
  "skillId"             TEXT NOT NULL,
  "semver"              TEXT NOT NULL,
  "authorId"            TEXT NOT NULL,
  "date"                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "status"              "VersionStatus" NOT NULL DEFAULT 'draft',
  "bodySnapshot"        TEXT NOT NULL,
  "frontmatterSnapshot" JSONB NOT NULL,
  "validationLog"       JSONB NOT NULL DEFAULT '[]',
  "diff"                TEXT,
  CONSTRAINT "SkillVersion_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SkillVersion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Connection
CREATE TABLE "Connection" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "fromSkillId" TEXT NOT NULL,
  "toSkillId"   TEXT NOT NULL,
  "type"        "ConnectionType" NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Connection_fromSkillId_fkey" FOREIGN KEY ("fromSkillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Connection_toSkillId_fkey" FOREIGN KEY ("toSkillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Deployment
CREATE TABLE "Deployment" (
  "id"             TEXT NOT NULL PRIMARY KEY,
  "skillId"        TEXT NOT NULL,
  "surface"        "Surface" NOT NULL,
  "versionPin"     TEXT NOT NULL,
  "installSnippet" TEXT NOT NULL,
  "createdById"    TEXT NOT NULL,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "Deployment_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Deployment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AuditLog
CREATE TABLE "AuditLog" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "actorId"    TEXT NOT NULL,
  "action"     TEXT NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId"   TEXT NOT NULL,
  "skillId"    TEXT,
  "metadata"   JSONB NOT NULL DEFAULT '{}',
  "timestamp"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Policy
CREATE TABLE "Policy" (
  "id"                 TEXT NOT NULL PRIMARY KEY,
  "requiredFields"     TEXT[] NOT NULL DEFAULT '{}',
  "allowedDepartments" TEXT[] NOT NULL DEFAULT '{}',
  "reviewSlaDays"      INTEGER NOT NULL DEFAULT 7,
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedById"        TEXT
);

-- Indexes for common queries
CREATE INDEX "Skill_departmentId_idx" ON "Skill"("departmentId");
CREATE INDEX "Skill_ownerId_idx" ON "Skill"("ownerId");
CREATE INDEX "Skill_governanceStatus_idx" ON "Skill"("governanceStatus");
CREATE INDEX "SkillVersion_skillId_idx" ON "SkillVersion"("skillId");
CREATE INDEX "Connection_fromSkillId_idx" ON "Connection"("fromSkillId");
CREATE INDEX "Connection_toSkillId_idx" ON "Connection"("toSkillId");
CREATE INDEX "Deployment_skillId_idx" ON "Deployment"("skillId");
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");
CREATE INDEX "AuditLog_skillId_idx" ON "AuditLog"("skillId");
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp" DESC);
