from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from agents import run_ip_scan, run_mentor_match, run_score_project, run_generate_report
app = FastAPI(title="Mak-TIC AI Agents API")

# --- Request Models ---
class IPScanRequest(BaseModel):
    title: str
    track: str
    sector: List[str]
    description: str
    problem_statement: str
    proposed_solution: str

class MentorMatchRequest(BaseModel):
    unmatched_projects_text: str
    mentors_text: str

class ScoreProjectRequest(BaseModel):
    title: str
    track: str
    sector: List[str]
    description: str
    problem_statement: str
    proposed_solution: str

class GenerateReportRequest(BaseModel):
    stats_json: str

# --- Endpoints ---

@app.post("/agents/generate-report")
async def api_generate_report(request: GenerateReportRequest):
    try:
        result = await run_generate_report(stats_json=request.stats_json)
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to parse structured output from AI")
        return result
    except Exception as e:
        print("Error in /agents/generate-report:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/ip-scan")
async def api_ip_scan(request: IPScanRequest):
    try:
        result = await run_ip_scan(
            project_title=request.title,
            project_track=request.track,
            project_sectors=request.sector,
            project_description=request.description,
            problem_statement=request.problem_statement,
            proposed_solution=request.proposed_solution
        )
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to parse structured output from AI")
        return result
    except Exception as e:
        print("Error in /agents/ip-scan:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/match-mentor")
async def api_match_mentor(request: MentorMatchRequest):
    try:
        result = await run_mentor_match(
            unmatched_projects_text=request.unmatched_projects_text,
            mentors_text=request.mentors_text
        )
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to parse structured output from AI")
        return result
    except Exception as e:
        print("Error in /agents/match-mentor:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/agents/score-project")
async def api_score_project(request: ScoreProjectRequest):
    try:
        result = await run_score_project(
            project_title=request.title,
            project_track=request.track,
            project_sectors=request.sector,
            project_description=request.description,
            problem_statement=request.problem_statement,
            proposed_solution=request.proposed_solution
        )
        if result is None:
            raise HTTPException(status_code=500, detail="Failed to parse structured output from AI")
        return result
    except Exception as e:
        print("Error in /agents/score-project:", e)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
