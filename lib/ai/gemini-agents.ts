import { google } from '@ai-sdk/google'
import { generateObject, generateText } from 'ai'
import { z } from 'zod'

// 1. Zod schema for structured project scoring output
export const projectScoreSchema = z.object({
  score: z.number().min(0).max(100).describe('Viability score based on problem clarity, solution feasibility, innovation, and market fit'),
  summary: z.string().describe('Executive summary of the proposal, 2-3 sentences max'),
  sdg_tags: z.array(z.number().min(1).max(17)).describe('Relevant UN Sustainable Development Goal numbers (1-17)'),
  sdg_reasoning: z.string().describe('Justification for why these specific SDGs apply'),
  strengths: z.array(z.string()).describe('Top 3 key strengths of the innovation'),
  concerns: z.array(z.string()).describe('Top 3 concerns, gaps, or risks in the application'),
  recommended_support: z.array(z.string()).describe('Which support categories (funding, mentorship, lab_access, ip_protection) are most critical'),
})

// 2. Zod schema for mentor matches
export const mentorMatchesSchema = z.object({
  matches: z.array(
    z.object({
      project_id: z.string().uuid(),
      mentor_id: z.string().uuid(),
      compatibility_score: z.number().min(0).max(100),
      reasoning: z.string().describe('Why this mentor is matched with the project'),
    })
  ),
})

// 3. Zod schema for duplicate checks
export const duplicateCheckSchema = z.object({
  is_duplicate: z.boolean().describe('True if these projects substantially overlap in problem and approach'),
  similarity: z.number().min(0).max(100),
  explanation: z.string().describe('Comparison details justifying duplicate status'),
  collaboration_potential: z.string().describe('Suggested synergy if they cooperate'),
})

// Initialize Google AI Studio provider
const gemini = google('gemini-2.5-flash', {
  // Config optional
})

const geminiPro = google('gemini-2.5-pro')

// Scorer Agent implementation
export async function runProjectScorer(projectData: {
  title: string
  track: string
  sectors: string[]
  description: string
  problem_statement: string
  proposed_solution: string
}) {
  const prompt = `
    Evaluate the following project submission for the Makerere University Technology & Innovation Center (Mak-TIC).
    
    Project Title: ${projectData.title}
    Track: ${projectData.track}
    Sectors: ${projectData.sectors.join(', ')}
    Problem Statement: ${projectData.problem_statement}
    Proposed Solution: ${projectData.proposed_solution}
    Description: ${projectData.description}
  `

  const result = await generateObject({
    model: gemini,
    schema: projectScoreSchema,
    system: `
      You are an expert innovation evaluator at Makerere University's Technology and Innovation Center in Kampala, Uganda. 
      Analyze project ideas submitted by university student entrepreneurs, researchers, and external creators.
      Focus on regional context (East Africa), technical feasibility, SDG relevance, and clarity.
    `,
    prompt,
    temperature: 0.2, // low temperature for consistency
  })

  return result.object
}

// Mentor Matcher Agent
export async function runMentorMatcher(
  project: { id: string; title: string; track: string; sectors: string[] },
  mentors: { id: string; name: string; expertise_sectors: string[]; bio_extended: string }[]
) {
  const prompt = `
    Find the best mentor pairings from the available pool for this project:
    Project ID: ${project.id}
    Title: ${project.title}
    Sectors: ${project.sectors.join(', ')}
    Track: ${project.track}

    Mentors Pool:
    ${JSON.stringify(mentors, null, 2)}
  `

  const result = await generateObject({
    model: gemini,
    schema: mentorMatchesSchema,
    system: 'You are an administrator matching innovation teams with mentors. Prioritize sector expertise and track experiences.',
    prompt,
  })

  return result.object
}

// Duplicate Confirmation Agent
export async function runDuplicateDetector(
  projectA: { title: string; problem: string; solution: string },
  projectB: { title: string; problem: string; solution: string }
) {
  const prompt = `
    Compare the following two projects and confirm if they overlap substantially.
    
    Project A:
    Title: ${projectA.title}
    Problem: ${projectA.problem}
    Solution: ${projectA.solution}

    Project B:
    Title: ${projectB.title}
    Problem: ${projectB.problem}
    Solution: ${projectB.solution}
  `

  const result = await generateObject({
    model: gemini,
    schema: duplicateCheckSchema,
    system: 'Analyze the problem statements and technology designs of these two proposals to flag exact duplicates or very close replicas.',
    prompt,
  })

  return result.object
}

// Quality assistant Chat Coach (Gemini Streaming response)
export async function runQualityChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  projectDraft: { title: string; description: string; problemStatement: string; proposedSolution: string }
) {
  const systemPrompt = `
    You are the Mak-TIC Innovation Submission Coach. Your job is to coach the applicant to improve their draft application before submission.
    
    Current Draft Details:
    Title: ${projectDraft.title || 'Untitled'}
    Problem Statement: ${projectDraft.problemStatement || 'Not written yet'}
    Proposed Solution: ${projectDraft.proposedSolution || 'Not written yet'}

    CRITICAL RULES:
    1. Do NOT write the content for the applicant. Only critique and offer constructive questions.
    2. Guide them on clarity, impact, SDGs, and technical feasibility.
    3. Keep answers concise, actionable, and encouraging.
  `

  const result = await generateText({
    model: gemini,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
  })

  return result.text
}
