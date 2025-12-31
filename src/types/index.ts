// User roles
export type UserRole = 'client' | 'reviewer' | 'admin'

// Request categories
export type RequestCategory = 'it_code' | 'translation' | 'academic'

// Request status
export type RequestStatus = 'open' | 'in_progress' | 'completed' | 'cancelled'

// Verdict types
export type Verdict = 'approved' | 'needs_revision' | 'dangerous'

// User profile
export interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: UserRole
  is_reviewer_approved: boolean
  reviewer_application_status: 'none' | 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

// IT/Code category options
export interface ITCodeOptions {
  phase: 'learning' | 'mvp' | 'production_small' | 'production_large'
  priority: 'fix' | 'security' | 'performance' | 'maintainability'
  tech_level: 'non_engineer' | 'beginner' | 'professional'
}

// Translation category options
export interface TranslationOptions {
  relationship: 'new' | 'existing_good' | 'existing_trouble' | 'internal' | 'public'
  purpose: 'request' | 'apology' | 'rejection' | 'notification' | 'proposal'
  concerns: ('condescending' | 'jargon' | 'grammar' | 'other')[]
}

// Academic category options
export interface AcademicOptions {
  medium: 'undergraduate' | 'peer_reviewed' | 'web_article' | 'business_doc'
  focus: 'existence_check' | 'content_match' | 'logic' | 'recency'
  policy: 'point_out_only' | 'suggest_alternatives'
}

// Audit request
export interface AuditRequest {
  id: string
  client_id: string
  reviewer_id: string | null
  category: RequestCategory
  title: string
  ai_chat_url: string | null
  content: string
  budget: number
  status: RequestStatus
  category_options: ITCodeOptions | TranslationOptions | AcademicOptions
  payment_intent_id: string | null
  created_at: string
  updated_at: string
  claimed_at: string | null
  completed_at: string | null
}

// Audit delivery
export interface AuditDelivery {
  id: string
  request_id: string
  reviewer_id: string
  verdict: Verdict
  comment: string
  revision: string | null
  created_at: string
}

// Platform settings
export interface PlatformSettings {
  id: string
  fee_rate: number
  updated_at: string
  updated_by: string | null
}

// Category configuration
export const CATEGORY_CONFIG = {
  it_code: {
    label: 'IT / コード監査',
    description: 'AIが生成したコードのセキュリティ、パフォーマンス、保守性をチェック',
    fields: {
      phase: {
        label: '利用フェーズ',
        options: [
          { value: 'learning', label: '学習・実験' },
          { value: 'mvp', label: 'MVP' },
          { value: 'production_small', label: '本番(小規模)' },
          { value: 'production_large', label: '本番(大規模)' }
        ]
      },
      priority: {
        label: '優先度',
        options: [
          { value: 'fix', label: '動作修復' },
          { value: 'security', label: 'セキュリティ' },
          { value: 'performance', label: 'パフォーマンス' },
          { value: 'maintainability', label: '保守性' }
        ]
      },
      tech_level: {
        label: '技術レベル',
        options: [
          { value: 'non_engineer', label: '非エンジニア' },
          { value: 'beginner', label: '初学者' },
          { value: 'professional', label: '実務者' }
        ]
      }
    }
  },
  translation: {
    label: 'ビジネス翻訳監査',
    description: 'AIが生成したビジネス文書の適切さ、ニュアンス、文法をチェック',
    fields: {
      relationship: {
        label: '関係性',
        options: [
          { value: 'new', label: '新規' },
          { value: 'existing_good', label: '既存(良好)' },
          { value: 'existing_trouble', label: '既存(トラブル)' },
          { value: 'internal', label: '社内' },
          { value: 'public', label: '公開' }
        ]
      },
      purpose: {
        label: '目的',
        options: [
          { value: 'request', label: '依頼' },
          { value: 'apology', label: '謝罪' },
          { value: 'rejection', label: '拒否' },
          { value: 'notification', label: '通知' },
          { value: 'proposal', label: '提案' }
        ]
      },
      concerns: {
        label: '懸念点',
        multiple: true,
        options: [
          { value: 'condescending', label: '上から目線' },
          { value: 'jargon', label: '専門用語' },
          { value: 'grammar', label: '文法' },
          { value: 'other', label: 'その他' }
        ]
      }
    }
  },
  academic: {
    label: '学術 / ファクトチェック',
    description: 'AIが生成した論文・記事の事実確認、引用チェック、論理構成を監査',
    fields: {
      medium: {
        label: '媒体',
        options: [
          { value: 'undergraduate', label: '学部課題' },
          { value: 'peer_reviewed', label: '論文(査読級)' },
          { value: 'web_article', label: 'Web記事' },
          { value: 'business_doc', label: 'ビジネス資料' }
        ]
      },
      focus: {
        label: '重点',
        options: [
          { value: 'existence_check', label: '実在確認' },
          { value: 'content_match', label: '内容照合' },
          { value: 'logic', label: '論理構成' },
          { value: 'recency', label: '最新性' }
        ]
      },
      policy: {
        label: '方針',
        options: [
          { value: 'point_out_only', label: '指摘のみ' },
          { value: 'suggest_alternatives', label: '代替案提示' }
        ]
      }
    }
  }
} as const

// Budget options
export const BUDGET_OPTIONS = [
  { value: 1000, label: '¥1,000' },
  { value: 3000, label: '¥3,000' },
  { value: 5000, label: '¥5,000' },
  { value: 10000, label: '¥10,000' },
  { value: 30000, label: '¥30,000' },
  { value: 50000, label: '¥50,000' }
]

// Verdict labels
export const VERDICT_LABELS: Record<Verdict, { label: string; color: string }> = {
  approved: { label: '合格', color: 'text-green-600 bg-green-100' },
  needs_revision: { label: '要修正', color: 'text-yellow-600 bg-yellow-100' },
  dangerous: { label: '危険(作り直し)', color: 'text-red-600 bg-red-100' }
}

// Status labels
export const STATUS_LABELS: Record<RequestStatus, { label: string; color: string }> = {
  open: { label: '募集中', color: 'text-blue-600 bg-blue-100' },
  in_progress: { label: '作業中', color: 'text-orange-600 bg-orange-100' },
  completed: { label: '完了', color: 'text-green-600 bg-green-100' },
  cancelled: { label: 'キャンセル', color: 'text-gray-600 bg-gray-100' }
}
