/**
 * Classification of a commit's nature
 */
export type CommitClassification =
  | 'breaking'
  | 'feature'
  | 'fix'
  | 'security'
  | 'performance'
  | 'refactor'
  | 'docs'
  | 'test'
  | 'chore';

/**
 * Impact severity level
 */
export type ImpactSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Impact assessment for a commit
 */
export interface CommitImpact {
  /** Overall severity of the commit's impact */
  severity: ImpactSeverity;
  /** Areas or components affected by the commit */
  areas: string[];
  /** List of breaking changes, if any */
  breakingChanges?: string[];
  /** Security implications, if any */
  securityImplications?: string[];
}

/**
 * A key change within a commit
 */
export interface KeyChange {
  /** File path that was modified */
  file: string;
  /** Brief description of the change */
  change: string;
}

/**
 * Structured analysis result from the commit analyzer sub-agent.
 *
 * Note: This interface focuses on analysis results only.
 * Metadata like commitId, message, and author are already known by the
 * primary agent and should not be included in the analysis output.
 */
export interface CommitAnalysis {
  /** Primary classification of the commit */
  classification: CommitClassification;
  /** Secondary classifications, if applicable */
  secondaryClassifications?: CommitClassification[];
  /** One-line summary describing what changed and why */
  summary: string;
  /** Impact assessment */
  impact: CommitImpact;
  /** Key file modifications worth highlighting */
  keyChanges: KeyChange[];
  /** Optional notes for reviewers or concerns */
  notes?: string;
}
