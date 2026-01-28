/**
 * Echo Prime AI Service for Shadowglass Security Platform
 * AI-powered security advisory and OSINT assistance
 *
 * Service URL: https://audio-intel-249995513427.us-central1.run.app
 */

const ECHO_PRIME_URL = 'https://audio-intel-249995513427.us-central1.run.app';

export interface EmotionData {
  primary_emotion: string;
  valence: number;
  arousal: number;
  intensity: number;
  mood: string;
  is_urgent: boolean;
}

export interface ChatResponse {
  response: string;
  personality: string;
  emotion: EmotionData;
  model: string;
}

export interface ReasoningResponse {
  response: string;
  model: string;
  thinking?: string;
}

export type SecurityPersonality = 'prometheus' | 'thorne' | 'gs343' | 'r2d2';

/**
 * Chat with ECHO Prime AI for security advisory
 * Uses 'prometheus' personality - the security specialist
 */
export async function chat(
  message: string,
  options?: {
    personality?: SecurityPersonality;
    systemPrompt?: string;
  }
): Promise<ChatResponse> {
  const response = await fetch(`${ECHO_PRIME_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      personality: options?.personality || 'prometheus',
      provider: 'groq',
      detect_emotion: true,
      tts_enabled: false,
      memory_enabled: true,
      system_prompt: options?.systemPrompt || `You are PROMETHEUS, the security and OSINT specialist.
You assist security professionals with:
- Penetration testing methodology and tactics
- Vulnerability analysis and prioritization
- OSINT reconnaissance techniques
- Security report writing
- Attack surface mapping
- Threat modeling
- Compliance framework guidance (OWASP, NIST, PCI-DSS)

Provide actionable, professional security advice.
Always emphasize authorized testing and ethical practices.
Reference industry standards and best practices.`
    })
  });

  if (!response.ok) {
    throw new Error(`Chat failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Deep reasoning for complex security analysis
 * Uses DeepSeek R1 for chain-of-thought reasoning
 */
export async function reason(
  prompt: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<ReasoningResponse> {
  const params = new URLSearchParams({
    prompt,
    model: 'deepseek-r1',
    max_tokens: String(options?.maxTokens || 8192),
    temperature: String(options?.temperature || 0.3)
  });

  const response = await fetch(`${ECHO_PRIME_URL}/reason?${params}`, {
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Reasoning failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get vulnerability analysis with severity assessment
 */
export async function analyzeVulnerability(
  vulnerability: {
    title: string;
    description: string;
    affectedComponent: string;
    cvss?: number;
    cwe?: string;
  }
): Promise<string> {
  const prompt = `Analyze this security finding:

Title: ${vulnerability.title}
Affected Component: ${vulnerability.affectedComponent}
CVSS Score: ${vulnerability.cvss ?? 'Not calculated'}
CWE: ${vulnerability.cwe ?? 'Not identified'}

Description:
${vulnerability.description}

Provide:
1. Severity assessment and business impact
2. Exploitation scenarios
3. Remediation recommendations (immediate, short-term, long-term)
4. Detection mechanisms
5. Related OWASP/CWE references`;

  const result = await chat(prompt, {
    personality: 'prometheus',
    systemPrompt: 'You are an expert vulnerability analyst. Provide detailed, actionable security assessments.'
  });

  return result.response;
}

/**
 * Generate executive summary for security assessment
 */
export async function generateExecutiveSummary(
  assessment: {
    name: string;
    scope: string;
    findingCounts: Record<string, number>;
    duration: string;
  }
): Promise<string> {
  const totalFindings = Object.values(assessment.findingCounts).reduce((a, b) => a + b, 0);

  const prompt = `Generate an executive summary for this security assessment:

Assessment: ${assessment.name}
Scope: ${assessment.scope}
Duration: ${assessment.duration}
Total Findings: ${totalFindings}
- Critical: ${assessment.findingCounts.critical ?? 0}
- High: ${assessment.findingCounts.high ?? 0}
- Medium: ${assessment.findingCounts.medium ?? 0}
- Low: ${assessment.findingCounts.low ?? 0}
- Informational: ${assessment.findingCounts.info ?? 0}

Create a professional executive summary suitable for C-level stakeholders.
Include risk posture assessment, key recommendations, and next steps.`;

  const result = await chat(prompt, {
    personality: 'thorne', // Thorne for executive communication
    systemPrompt: 'You are writing for executive stakeholders. Be concise, professional, and focus on business impact.'
  });

  return result.response;
}

/**
 * Get remediation guidance for a finding
 */
export async function getRemediationGuidance(
  findingType: string,
  technology: string
): Promise<string> {
  const prompt = `Provide detailed remediation guidance for:

Finding Type: ${findingType}
Technology Stack: ${technology}

Include:
1. Step-by-step remediation instructions
2. Code examples or configuration changes where applicable
3. Verification steps to confirm the fix
4. Prevention measures for future occurrences
5. Relevant security references and resources`;

  const result = await chat(prompt, {
    personality: 'gs343', // GS343 for technical fixes
    systemPrompt: 'You are a security remediation specialist. Provide precise, technical guidance with examples.'
  });

  return result.response;
}

/**
 * Generate OSINT reconnaissance plan
 */
export async function generateReconPlan(
  target: string,
  targetType: 'domain' | 'organization' | 'person',
  scope: 'passive' | 'active' | 'full'
): Promise<string> {
  const prompt = `Create an OSINT reconnaissance plan for:

Target: ${target}
Type: ${targetType}
Scope: ${scope}

Include:
1. Information gathering phases
2. Recommended tools for each phase
3. Expected data points to collect
4. Legal and ethical considerations
5. Documentation requirements`;

  const result = await reason(prompt, { maxTokens: 4096 });
  return result.response;
}

/**
 * Analyze emotion in client communication (for prioritization)
 */
export async function analyzeEmotion(text: string): Promise<EmotionData> {
  const response = await fetch(`${ECHO_PRIME_URL}/emotion/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error(`Emotion analysis failed: ${response.status}`);
  }

  const data = await response.json();
  return data.emotion;
}

/**
 * Health check
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${ECHO_PRIME_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export const echoPrime = {
  chat,
  reason,
  analyzeVulnerability,
  generateExecutiveSummary,
  getRemediationGuidance,
  generateReconPlan,
  analyzeEmotion,
  checkHealth
};

export default echoPrime;
