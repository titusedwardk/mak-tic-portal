import uuid
from datetime import datetime
from database import db
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

def get_uuid():
    return str(uuid.uuid4())

class User(db.Model, UserMixin):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    avatar_url = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(30), nullable=False, default='innovator')  # innovator, reviewer, mentor, admin, lab_manager, investor, public
    affiliation = db.Column(db.String(50), nullable=False, default='external')  # makerere_student, makerere_staff, makerere_alumni, external
    student_id = db.Column(db.String(50), nullable=True)
    department = db.Column(db.String(100), nullable=True)
    bio = db.Column(db.Text, nullable=True)
    skills = db.Column(db.String(255), nullable=True, default='')  # Comma-separated tags
    linkedin_url = db.Column(db.String(255), nullable=True)
    onboarding_complete = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owned_projects = db.relationship('Project', backref='owner', lazy=True, cascade='all, delete-orphan')
    memberships = db.relationship('ProjectMember', backref='user', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('StageGateReview', backref='reviewer', lazy=True)
    notifications = db.relationship('Notification', backref='user', lazy=True, cascade='all, delete-orphan')
    mentor_profile = db.relationship('MentorProfile', backref='user', uselist=False, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    title = db.Column(db.String(200), nullable=False)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=False)
    problem_statement = db.Column(db.Text, nullable=False)
    proposed_solution = db.Column(db.Text, nullable=False)
    owner_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    track = db.Column(db.String(50), nullable=False)  # early_idea, prototype, market_ready, ip_only, challenge_response
    sector = db.Column(db.String(255), nullable=False, default='')  # Comma-separated
    sdg_tags = db.Column(db.String(100), nullable=True, default='')  # Comma-separated numbers, e.g. "1,3,9"
    stage = db.Column(db.String(50), nullable=False, default='submitted')  # submitted, screening, problem_validation, solution_viability, impact_assessment, prototype_review, commercialization, graduated, archived
    status = db.Column(db.String(30), nullable=False, default='active')  # active, paused, withdrawn, rejected
    support_needed = db.Column(db.String(255), nullable=False, default='')  # Comma-separated
    ai_score = db.Column(db.Float, nullable=True)
    ai_summary = db.Column(db.Text, nullable=True)
    ai_sdg_reasoning = db.Column(db.Text, nullable=True)
    is_public = db.Column(db.Boolean, default=False)
    pitch_video_url = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    members = db.relationship('ProjectMember', backref='project', lazy=True, cascade='all, delete-orphan')
    files = db.relationship('ProjectFile', backref='project', lazy=True, cascade='all, delete-orphan')
    milestones = db.relationship('ProjectMilestone', backref='project', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('StageGateReview', backref='project', lazy=True, cascade='all, delete-orphan')

class ProjectMember(db.Model):
    __tablename__ = 'project_members'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(50), nullable=False)  # lead, co_founder, member, advisor
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProjectFile(db.Model):
    __tablename__ = 'project_files'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    uploaded_by = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(50), nullable=False)  # pitch_deck, business_plan, prototype_doc, demo_video, financial_model, ip_doc, other
    storage_path = db.Column(db.String(255), nullable=False)
    file_size_bytes = db.Column(db.BigInteger, nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProjectMilestone(db.Model):
    __tablename__ = 'project_milestones'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    completed_at = db.Column(db.DateTime, nullable=True)
    evidence_url = db.Column(db.String(255), nullable=True)
    verified_by = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    status = db.Column(db.String(50), nullable=False, default='pending')  # pending, in_progress, completed, overdue

class StageGateReview(db.Model):
    __tablename__ = 'stage_gate_reviews'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    reviewer_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    gate = db.Column(db.String(50), nullable=False)  # same as project_stage
    score_impact = db.Column(db.Integer, nullable=False)       # 1-10
    score_feasibility = db.Column(db.Integer, nullable=False)  # 1-10
    score_team = db.Column(db.Integer, nullable=False)         # 1-10
    score_innovation = db.Column(db.Integer, nullable=False)   # 1-10
    score_market = db.Column(db.Integer, nullable=False)       # 1-10
    weighted_total = db.Column(db.Float, nullable=False)
    comments = db.Column(db.Text, nullable=True)
    recommendation = db.Column(db.String(50), nullable=False)  # advance, revise_resubmit, hold, reject
    is_ai_review = db.Column(db.Boolean, default=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # review_assigned, stage_advanced, etc.
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    link = db.Column(db.String(255), nullable=True)
    read_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MentorProfile(db.Model):
    __tablename__ = 'mentor_profiles'
    
    id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    expertise_sectors = db.Column(db.String(255), nullable=False)  # Comma-separated sectors
    max_mentees = db.Column(db.Integer, default=5)
    current_mentees = db.Column(db.Integer, default=0)
    availability = db.Column(db.Text, nullable=False, default='[]')  # JSON string representation
    languages = db.Column(db.String(100), default='english')  # Comma-separated
    rating_avg = db.Column(db.Float, default=0.00)
    total_sessions = db.Column(db.Integer, default=0)
    bio_extended = db.Column(db.Text, nullable=True)
    
    assignments = db.relationship('MentorAssignment', backref='mentor', lazy=True, cascade='all, delete-orphan')

class MentorAssignment(db.Model):
    __tablename__ = 'mentor_assignments'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    mentor_id = db.Column(db.String(36), db.ForeignKey('mentor_profiles.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String(30), default='proposed')  # proposed, active, completed, terminated
    start_date = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    sessions = db.relationship('MentorSession', backref='assignment', lazy=True, cascade='all, delete-orphan')

class MentorSession(db.Model):
    __tablename__ = 'mentor_sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    assignment_id = db.Column(db.String(36), db.ForeignKey('mentor_assignments.id', ondelete='CASCADE'), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    duration_minutes = db.Column(db.Integer, default=60)
    status = db.Column(db.String(30), default='scheduled')  # scheduled, completed, cancelled, no_show
    meeting_link = db.Column(db.String(255), nullable=True)
    notes_mentor = db.Column(db.Text, nullable=True)
    feedback_innovator = db.Column(db.Text, nullable=True)
    rating_innovator = db.Column(db.Integer, nullable=True)  # 1-5
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ProjectEmbedding(db.Model):
    __tablename__ = 'project_embeddings'
    
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True)
    embedding_json = db.Column(db.Text, nullable=False)  # Local SQLite stores JSON representation of vector

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=get_uuid)
    actor_id = db.Column(db.String(36), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    action = db.Column(db.String(100), nullable=False)  # project.submit, review.score, etc.
    entity_type = db.Column(db.String(50), nullable=False)  # project, review, etc.
    entity_id = db.Column(db.String(36), nullable=False)
    metadata_json = db.Column(db.Text, default='{}')  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

