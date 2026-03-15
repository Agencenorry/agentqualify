/**
 * Types TypeScript pour AgentQualify by Norry
 */

export type LeadStatus = 'hot' | 'warm' | 'cold';

/** Types de déclencheurs pour l'overlay */
export type TriggerType = 'click' | 'page' | 'timer' | 'scroll';

export interface TriggerConfig {
  selector?: string;
  path?: string;
  delaySeconds?: number;
  seconds?: number;
  threshold?: number;
}

export interface Trigger {
  id: string;
  type: TriggerType;
  label: string;
  config: TriggerConfig;
  active: boolean;
}

export interface Client {
  id: string;
  created_at: string;
  name: string;
  website_url: string | null;
  contact_email: string | null;
  is_active: boolean;
  agent_name: string | null;
  agent_greeting: string | null;
  business_description: string | null;
  business_offers: string | null;
  icp: string | null;
  disqualify_criteria: string | null;
  qualification_questions: string[];
  rdv_link: string | null;
  cta_text: string | null;
  cta_url: string | null;
  notification_email: string | null;
  widget_color: string | null;
  widget_position: string | null;
  triggers?: Trigger[];
}

export interface Lead {
  id: string;
  created_at: string;
  client_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  role: string | null;
  team_size: string | null;
  main_challenge: string | null;
  budget: string | null;
  score: number | null;
  status: LeadStatus | null;
  summary: string | null;
  recommendations: string[] | null;
  rdv_proposed: boolean;
  rdv_booked: boolean;
  conversation_id: string | null;
}

export interface Conversation {
  id: string;
  created_at: string;
  client_id: string;
  lead_id: string | null;
  messages: ChatMessage[];
  is_qualified: boolean;
  visitor_info: Record<string, unknown>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequestBody {
  clientId: string;
  messages: ChatMessage[];
  conversationId?: string | null;
}

export interface ChatResponse {
  content: string;
  qualified: boolean;
  lead?: Lead;
  conversationId?: string;
  contextCard?: ContextCard;
}

/** Réalisation client (case study) pour injection contextuelle */
export interface CaseStudy {
  id: string;
  created_at?: string;
  client_id: string;
  sector: string;
  sector_keywords: string[];
  company_name: string;
  result: string;
  description: string | null;
  logo_url: string | null;
  case_url: string | null;
  is_active: boolean;
}

/** Insight / stat pour injection contextuelle */
export interface Insight {
  id: string;
  created_at?: string;
  client_id: string;
  challenge_keywords: string[];
  stat: string;
  context: string;
  source: string | null;
  is_active: boolean;
}

export type ContextCard =
  | { type: 'case_study'; companyName: string; result: string; description?: string | null; logoUrl?: string | null; caseUrl?: string | null }
  | { type: 'insight'; stat: string; context: string; source?: string | null };
