import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from agents import run_ip_scan, run_mentor_match, run_score_project, run_generate_report
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Mak-TIC AI Agents API")

# CORS middleware for cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Health Check ---
@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/")
async def root():
    return {"service": "Mak-TIC AI Agents", "status": "running"}

# --- Request Models ---
class IPScanRequest(BaseModel):
    title: str
    track: str
    sector: List[str] = []
    description: str
    problem_statement: str
    proposed_solution: str

class MentorMatchRequest(BaseModel):
    unmatched_projects_text: str
    mentors_text: str

class ScoreProjectRequest(BaseModel):
    title: str
    track: str
    sector: List[str] = []
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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in /agents/generate-report: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI processing failed")

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in /agents/ip-scan: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI processing failed")

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in /agents/match-mentor: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI processing failed")

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
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in /agents/score-project: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="AI processing failed")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
