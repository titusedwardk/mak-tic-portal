from google.antigravity import Agent, LocalAgentConfig
import pydantic

# ==========================================
# Schema Definitions
# ==========================================

class IPScanResult(pydantic.BaseModel):
    potentialIpTypes: list[str]
    priorArtRisks: str
    recommendedStrategy: str

class MentorMatchSuggestion(pydantic.BaseModel):
    projectId: str
    mentorId: str
    compatibilityScore: int
    reasoning: str

class MentorMatchResult(pydantic.BaseModel):
    suggestions: list[MentorMatchSuggestion]

class ScoreProjectResult(pydantic.BaseModel):
    viability_score: int
    ai_summary: str
    sdg_tags: list[int]

class ReportGeneratorResult(pydantic.BaseModel):
    report: str

# ==========================================
# Agent Run Functions
# ==========================================

async def run_ip_scan(project_title: str, project_track: str, project_sectors: list[str], project_description: str, problem_statement: str, proposed_solution: str) -> dict:
    system_prompt = """You are an expert Intellectual Property (IP) attorney and technology strategist at Makerere University.
Your task is to analyze an innovation project's details and provide an IP landscape scan. 

Based on the project's title, track, sector, problem statement, and proposed solution, you should:
1. Identify potential IP types applicable (e.g., Patent, Copyright, Trademark, Trade Secret, Utility Model).
2. Highlight potential prior art risks (general concepts or existing technologies that might conflict).
3. Recommend a concise 2-3 sentence IP protection strategy."""

    user_prompt = f"""
PROJECT DETAILS:
Title: {project_title}
Track: {project_track}
Sectors: {", ".join(project_sectors)}
Description: {project_description}
Problem: {problem_statement}
Solution: {proposed_solution}
"""

    config = LocalAgentConfig(
        model="gemini-3.1-pro",
        system_instructions=system_prompt,
        response_schema=IPScanResult
    )

    async with Agent(config) as agent:
        response = await agent.chat(user_prompt)
        return await response.structured_output()


async def run_mentor_match(unmatched_projects_text: str, mentors_text: str) -> dict:
    system_prompt = """You are an expert matchmaking AI for an Innovation Hub.
Your goal is to match unstructured project descriptions with the best available mentors.

Input data:
1. A list of unmatched projects (with their track, sectors, and problem statement).
2. A list of active mentors (with their expertise, industry, and availability).

Task:
For each project, assign the single best mentor ID based on skill overlap and sector alignment.
Provide a compatibility score (1-100) and a brief 1-2 sentence reasoning."""

    user_prompt = f"""
PROJECTS:
{unmatched_projects_text}

MENTORS:
{mentors_text}
"""
    
    config = LocalAgentConfig(
        model="gemini-3.1-pro",
        system_instructions=system_prompt,
        response_schema=MentorMatchResult
    )

    async with Agent(config) as agent:
        response = await agent.chat(user_prompt)
        return await response.structured_output()


async def run_score_project(project_title: str, project_track: str, project_sectors: list[str], project_description: str, problem_statement: str, proposed_solution: str) -> dict:
    system_prompt = """You are an expert innovation evaluator for the Mak-TIC (Makerere University Technology Innovation and Commercialization) portal.
Evaluate the following project submission based on its description, problem statement, and proposed solution.
Return a structured JSON object containing:
- viability_score: An integer out of 100 representing market viability and technical feasibility.
- ai_summary: A 2-3 sentence executive summary.
- sdg_tags: An array of integers (1-17) representing the UN Sustainable Development Goals addressed by this project."""

    user_prompt = f"""
Title: {project_title}
Track: {project_track}
Sectors: {", ".join(project_sectors)}
Description: {project_description}
Problem: {problem_statement}
Solution: {proposed_solution}
"""
    
    config = LocalAgentConfig(
        model="gemini-3.1-pro",
        system_instructions=system_prompt,
        response_schema=ScoreProjectResult
    )

    async with Agent(config) as agent:
        response = await agent.chat(user_prompt)
        return await response.structured_output()

async def run_generate_report(stats_json: str) -> dict:
    system_prompt = """You are an expert grant writer and program director for the Mak-TIC Innovation Hub.
Your task is to take a JSON object containing raw analytics about our current innovation pipeline and write a professional, narrative executive summary.
This report is intended for external funders (e.g., UNDP, World Bank).

Requirements:
- Summarize the total projects and pipeline distribution.
- Highlight the top SDGs being addressed.
- Maintain a professional, encouraging, and impactful tone.
- Format the output with clear paragraphs and bullet points (Markdown supported).
"""

    user_prompt = f"Here is the raw data:\n\n{stats_json}"
    
    config = LocalAgentConfig(
        model="gemini-3.1-pro",
        system_instructions=system_prompt,
        response_schema=ReportGeneratorResult
    )

    async with Agent(config) as agent:
        response = await agent.chat(user_prompt)
        return await response.structured_output()
