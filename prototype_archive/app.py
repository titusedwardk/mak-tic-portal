import os
import json
import urllib.request
import urllib.error
import re
import uuid
from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, jsonify, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from database import db
from config import Config
from models import User, Project, ProjectMember, ProjectFile, ProjectMilestone, StageGateReview, Notification

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize DB
    db.init_app(app)
    
    # Initialize Login Manager
    login_manager = LoginManager()
    login_manager.login_view = 'login'
    login_manager.init_app(app)
    
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(user_id)
    
    # Ensure upload directory exists
    upload_dir = os.path.join(app.root_path, 'static', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    
    # Helper to call Google Gemini API via urllib
    def call_gemini(prompt, system_instruction=None, response_json=False):
        api_key = app.config['GEMINI_API_KEY']
        use_simulator = app.config['USE_GEMINI_SIMULATOR'] or not api_key
        
        if use_simulator:
            return simulate_gemini(prompt, system_instruction, response_json)
            
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        
        contents = []
        if system_instruction:
            # For gemini-2.5-flash, the standard systemInstruction goes into systemInstruction field in request body.
            # But putting it in the contents or systemInstruction is simple. Let's send a standard body:
            payload = {
                "contents": [
                    {
                        "parts": [{"text": f"{system_instruction}\n\nUser Input: {prompt}"}]
                    }
                ],
                "generationConfig": {}
            }
        else:
            payload = {
                "contents": [
                    {
                        "parts": [{"text": prompt}]
                    }
                ],
                "generationConfig": {}
            }
            
        if response_json:
            payload["generationConfig"]["responseMimeType"] = "application/json"
            
        headers = {
            "Content-Type": "application/json"
        }
        
        try:
            req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
            with urllib.request.urlopen(req, timeout=15) as response:
                res_data = json.loads(response.read().decode('utf-8'))
                
            # Extract text
            text_response = res_data['candidates'][0]['content']['parts'][0]['text']
            return text_response
        except urllib.error.URLError as e:
            print(f"Gemini API Connection Error: {e}. Falling back to simulation mode.")
            return simulate_gemini(prompt, system_instruction, response_json)
        except Exception as e:
            print(f"Gemini API Execution Error: {e}. Falling back to simulation mode.")
            return simulate_gemini(prompt, system_instruction, response_json)

    # Simulator fallback for Gemini calls
    def simulate_gemini(prompt, system_instruction=None, response_json=False):
        if response_json:
            # Parse project details from prompt if it's the Project Scorer
            title_match = re.search(r"Title:\s*(.*?)(?:\n|$)", prompt, re.IGNORECASE)
            desc_match = re.search(r"Description:\s*(.*?)(?:\n|$)", prompt, re.IGNORECASE)
            prob_match = re.search(r"Problem:\s*(.*?)(?:\n|$)", prompt, re.IGNORECASE)
            sol_match = re.search(r"Solution:\s*(.*?)(?:\n|$)", prompt, re.IGNORECASE)
            sector_match = re.search(r"Sector:\s*(.*?)(?:\n|$)", prompt, re.IGNORECASE)
            
            title = title_match.group(1) if title_match else "Selected Project"
            desc = desc_match.group(1) if desc_match else ""
            prob = prob_match.group(1) if prob_match else ""
            sol = sol_match.group(1) if sol_match else ""
            sector = sector_match.group(1) if sector_match else ""
            
            # Formulate simulated values
            score = 75.0
            if "ai" in desc.lower() or "gemini" in desc.lower() or "iot" in desc.lower():
                score += 10.0
            if "banana" in desc.lower() or "matooke" in desc.lower() or "plastic" in desc.lower():
                score += 8.0
            if len(prob) > 200:
                score += 5.0
            score = min(score, 98.0)
            
            # Map sectors to SDGs
            sdgs = [9] # Industry & Innovation default
            sdg_reasoning_parts = ["SDG 9: Supports research, technological capabilities, and local innovation infrastructure."]
            
            all_text = (title + " " + desc + " " + prob + " " + sol + " " + sector).lower()
            if any(k in all_text for k in ["farm", "crop", "agriculture", "soil", "food", "matooke", "banana"]):
                sdgs.append(2)
                sdg_reasoning_parts.append("SDG 2 (Zero Hunger): Aims to improve smallholder agricultural productivity and food safety.")
            if any(k in all_text for k in ["health", "medical", "disease", "patient", "clinic"]):
                sdgs.append(3)
                sdg_reasoning_parts.append("SDG 3 (Good Health & Well-being): Promotes diagnostic or patient treatment improvements.")
            if any(k in all_text for k in ["learn", "school", "education", "student", "class"]):
                sdgs.append(4)
                sdg_reasoning_parts.append("SDG 4 (Quality Education): Increases educational accessibility or digitises academic resources.")
            if any(k in all_text for k in ["water", "irrigation", "clean water"]):
                sdgs.append(6)
                sdg_reasoning_parts.append("SDG 6 (Clean Water & Sanitation): Promotes efficient agricultural irrigation and clean water access.")
            if any(k in all_text for k in ["power", "solar", "grid", "electricity", "energy"]):
                sdgs.append(7)
                sdg_reasoning_parts.append("SDG 7 (Affordable & Clean Energy): Uses solar panels or clean bio-energy alternatives.")
            if any(k in all_text for k in ["pay", "payment", "bank", "momo", "merchant", "fintech", "job", "business"]):
                sdgs.append(8)
                sdg_reasoning_parts.append("SDG 8 (Decent Work & Economic Growth): Simplifies payments for micro-merchants and boosts local trade.")
            if any(k in all_text for k in ["plastic", "recycle", "waste", "paper", "biodegradable"]):
                sdgs.append(12)
                sdg_reasoning_parts.append("SDG 12 (Responsible Consumption & Production): Recycles agricultural waste products to replace single-use plastic.")
            if any(k in all_text for k in ["climate", "co2", "deforestation"]):
                sdgs.append(13)
                sdg_reasoning_parts.append("SDG 13 (Climate Action): Focuses on decreasing carbon emission levels or slowing deforestation.")

            # Unique list
            sdgs = list(set(sdgs))
            
            simulated_response = {
                "score": score,
                "summary": f"This project, '{title}', addresses a critical gap by developing an innovation in the {sector if sector else 'technology'} domain. The solution leverages local materials and resources to create an efficient, scalable outcome.",
                "sdg_tags": sdgs,
                "sdg_reasoning": " | ".join(sdg_reasoning_parts),
                "strengths": [
                    "Strong alignment with local community needs and Uganda's development goals.",
                    "High resource efficiency using low-cost hardware or agricultural waste materials.",
                    "Feasible technical implementation pathway with clear step-by-step logic."
                ],
                "concerns": [
                    "Potential challenges scaling distribution to off-grid rural areas.",
                    "Lack of detail regarding competition and alternative solutions in East Africa.",
                    "High dependence on key technical talent which may lead to operational bottlenecks."
                ],
                "recommended_support": ["funding", "mentorship", "lab_access"]
            }
            return json.dumps(simulated_response)
        else:
            # Simulate Assistant Chat Response
            lc_prompt = prompt.lower()
            if "problem" in lc_prompt or "problem statement" in lc_prompt:
                return "Your problem statement seems well-oriented! However, to make it truly compelling for our review committee, make sure you clearly state the *quantified* scale of the problem. For example, instead of saying 'farmers lose crops', specify: 'According to reports, smallholder farmers in Uganda lose up to 40% of crop yields due to...' Can you share the exact statistics you plan to use?"
            elif "solution" in lc_prompt or "proposed solution" in lc_prompt:
                return "The proposed solution is clear and shows direct user benefit. A great way to improve this section is to outline your MVP (Minimum Viable Product) features. What are the absolute core features required for your first prototype? Avoid promising too many complex features initially so reviewers know your plan is highly realistic."
            elif "team" in lc_prompt or "co-founder" in lc_prompt:
                return "Having a multidisciplinary team is highly valued at Mak-TIC. Ensure you detail who is handling the business/commercialization strategy versus who is handling technical hardware/software engineering. Reviewers look for balanced skill sets. Do you have roles clearly assigned for this project?"
            else:
                return "That is a great start for your Mak-TIC innovation profile. To elevate your application, make sure to link your technical choices (like ESP32 controllers or banana stem decorticators) directly back to cost-efficiency and local availability. Reviewers love seeing highly practical, resource-aware project applications. What other sections can I help you review?"
                
    # --- ROUTES ---
    
    @app.route('/')
    def index():
        stats = {
            'innovators': User.query.filter_by(role='innovator').count(),
            'projects': Project.query.count(),
            'funding': "UGX 45,000,000",
            'success_rate': "87%"
        }
        recent_public_projects = Project.query.filter_by(is_public=True).limit(3).all()
        return render_template('index.html', stats=stats, projects=recent_public_projects)
        
    @app.route('/login', methods=['GET', 'POST'])
    def login():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
            
        if request.method == 'POST':
            email = request.form.get('email')
            password = request.form.get('password')
            
            user = User.query.filter_by(email=email).first()
            if user and user.check_password(password):
                login_user(user)
                flash('Welcome back to the Mak-TIC Portal!', 'success')
                next_page = request.args.get('next')
                return redirect(next_page or url_for('dashboard'))
            else:
                flash('Invalid email or password. Please try again.', 'error')
                
        return render_template('login.html')
        
    @app.route('/register', methods=['GET', 'POST'])
    def register():
        if current_user.is_authenticated:
            return redirect(url_for('dashboard'))
            
        if request.method == 'POST':
            # Simplified form handling (client js handles the multi-step navigation)
            email = request.form.get('email')
            password = request.form.get('password')
            full_name = request.form.get('full_name')
            role = request.form.get('role', 'innovator')
            affiliation = request.form.get('affiliation', 'external')
            student_id = request.form.get('student_id')
            department = request.form.get('department')
            bio = request.form.get('bio')
            skills = request.form.get('skills')
            linkedin_url = request.form.get('linkedin_url')
            
            # Validation
            if User.query.filter_by(email=email).first():
                flash('Email is already registered. Please login.', 'error')
                return render_template('register.html')
                
            user = User(
                email=email,
                full_name=full_name,
                role=role,
                affiliation=affiliation,
                student_id=student_id if affiliation in ['makerere_student', 'makerere_staff'] else None,
                department=department,
                bio=bio,
                skills=skills,
                linkedin_url=linkedin_url,
                onboarding_complete=True
            )
            user.set_password(password)
            
            db.session.add(user)
            db.session.commit()
            
            login_user(user)
            flash('Registration successful! Welcome to the portal.', 'success')
            return redirect(url_for('dashboard'))
            
        return render_template('register.html')
        
    @app.route('/logout')
    @login_required
    def logout():
        logout_user()
        flash('You have logged out successfully.', 'info')
        return redirect(url_for('index'))
        
    @app.route('/forgot-password', methods=['GET', 'POST'])
    def forgot_password():
        if request.method == 'POST':
            email = request.form.get('email')
            # Mock sending email
            flash(f"A password reset link has been sent to {email} (Simulated).", 'success')
            return redirect(url_for('login'))
        return render_template('login.html', forgot=True)

    @app.route('/dashboard')
    @login_required
    def dashboard():
        # Load user projects
        if current_user.role in ['admin', 'reviewer']:
            projects = Project.query.all()
            total_reviews = StageGateReview.query.filter_by(is_ai_review=False).count()
        else:
            # Find projects where user is owner or member
            projects = Project.query.filter(
                (Project.owner_id == current_user.id) | 
                Project.members.any(user_id=current_user.id)
            ).all()
            total_reviews = 0
            
        milestones = []
        for p in projects:
            milestones.extend(ProjectMilestone.query.filter_by(project_id=p.id).all())
            
        # Get active milestones, sort by status and due date
        active_milestones = [m for m in milestones if m.status in ['pending', 'in_progress', 'overdue']]
        active_milestones.sort(key=lambda x: (x.status != 'overdue', x.due_date or date.max))
        
        # Pull notifications
        notifications = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(5).all()
        
        return render_template(
            'dashboard.html', 
            projects=projects, 
            milestones=active_milestones[:3], 
            notifications=notifications
        )

    @app.route('/projects')
    @login_required
    def projects():
        if current_user.role in ['admin', 'reviewer']:
            projects_list = Project.query.order_by(Project.created_at.desc()).all()
        else:
            projects_list = Project.query.filter(
                (Project.owner_id == current_user.id) | 
                Project.members.any(user_id=current_user.id)
            ).order_by(Project.created_at.desc()).all()
        return render_template('projects.html', projects=projects_list)

    @app.route('/projects/new', methods=['GET', 'POST'])
    @login_required
    def project_new():
        if request.method == 'POST':
            title = request.form.get('title')
            track = request.form.get('track')
            sector = request.form.get('sector')
            description = request.form.get('description')
            problem_statement = request.form.get('problem_statement')
            proposed_solution = request.form.get('proposed_solution')
            support_needed = request.form.get('support_needed')
            is_public = 'is_public' in request.form
            pitch_video_url = request.form.get('pitch_video_url')
            
            # Autogenerate slug
            slug_base = re.sub(r'[^a-zA-Z0-9]+', '-', title).lower().strip('-')
            slug = f"{slug_base}-{str(uuid.uuid4())[:8]}"
            
            project = Project(
                title=title,
                slug=slug,
                description=description,
                problem_statement=problem_statement,
                proposed_solution=proposed_solution,
                owner_id=current_user.id,
                track=track,
                sector=sector,
                support_needed=support_needed,
                is_public=is_public,
                pitch_video_url=pitch_video_url,
                stage='submitted'
            )
            
            db.session.add(project)
            db.session.commit()
            
            # Add owner as Lead member
            member = ProjectMember(
                project_id=project.id,
                user_id=current_user.id,
                role='lead'
            )
            db.session.add(member)
            
            # Handle mock file upload
            pitch_deck = request.files.get('pitch_deck')
            if pitch_deck and pitch_deck.filename:
                # Save file
                filename = f"{project.id}_{pitch_deck.filename}"
                storage_path = os.path.join('static', 'uploads', filename)
                pitch_deck.save(os.path.join(app.root_path, storage_path))
                
                project_file = ProjectFile(
                    project_id=project.id,
                    uploaded_by=current_user.id,
                    file_name=pitch_deck.filename,
                    file_type='pitch_deck',
                    storage_path=storage_path,
                    file_size_bytes=os.path.getsize(os.path.join(app.root_path, storage_path)),
                    mime_type=pitch_deck.mimetype or 'application/octet-stream'
                )
                db.session.add(project_file)
                
            db.session.commit()
            
            # Create a notification
            notif = Notification(
                user_id=current_user.id,
                type='stage_advanced',
                title='Project Submitted Successfully',
                body=f"Your project '{title}' has been submitted. The AI Scoring agent is currently evaluating your proposal.",
                link=url_for('project_detail', project_id=project.id)
            )
            db.session.add(notif)
            db.session.commit()
            
            # Trigger AI Scorer (background simulated, or sync here since it's fast)
            trigger_ai_scoring(project.id)
            
            flash(f"Project '{title}' submitted successfully! AI evaluation complete.", 'success')
            return redirect(url_for('project_detail', project_id=project.id))
            
        return render_template('project_new.html')

    @app.route('/projects/<project_id>')
    @login_required
    def project_detail(project_id):
        project = Project.query.get_or_404(project_id)
        
        # Check permissions: owners, members, reviewers, and admins can view
        is_member = current_user.role in ['admin', 'reviewer'] or \
                    project.owner_id == current_user.id or \
                    any(m.user_id == current_user.id for m in project.members)
                    
        if not is_member:
            flash('You do not have permission to view this project.', 'error')
            return redirect(url_for('dashboard'))
            
        # Parse SDG numbers
        sdg_list = [int(x.strip()) for x in project.sdg_tags.split(',') if x.strip().isdigit()] if project.sdg_tags else []
        
        # Calculate radar chart scores
        reviews = StageGateReview.query.filter_by(project_id=project.id, gate=project.stage).all()
        chart_scores = {
            'impact': 0, 'feasibility': 0, 'team': 0, 'innovation': 0, 'market': 0
        }
        if reviews:
            count = len(reviews)
            chart_scores['impact'] = sum(r.score_impact for r in reviews) / count
            chart_scores['feasibility'] = sum(r.score_feasibility for r in reviews) / count
            chart_scores['team'] = sum(r.score_team for r in reviews) / count
            chart_scores['innovation'] = sum(r.score_innovation for r in reviews) / count
            chart_scores['market'] = sum(r.score_market for r in reviews) / count
            
        return render_template(
            'project_detail.html', 
            project=project, 
            sdg_list=sdg_list,
            chart_scores=chart_scores,
            reviews=reviews
        )
        
    @app.route('/projects/<project_id>/milestone/new', methods=['POST'])
    @login_required
    def milestone_new(project_id):
        title = request.form.get('title')
        description = request.form.get('description')
        due_date_str = request.form.get('due_date')
        
        due_date = None
        if due_date_str:
            due_date = datetime.strptime(due_date_str, '%Y-%m-%d').date()
            
        milestone = ProjectMilestone(
            project_id=project_id,
            title=title,
            description=description,
            due_date=due_date,
            status='pending'
        )
        db.session.add(milestone)
        db.session.commit()
        
        flash('Milestone added successfully!', 'success')
        return redirect(url_for('project_detail', project_id=project_id))
        
    @app.route('/projects/<project_id>/milestone/<milestone_id>/complete', methods=['POST'])
    @login_required
    def milestone_complete(project_id):
        milestone = ProjectMilestone.query.get_or_404(milestone_id)
        evidence_url = request.form.get('evidence_url')
        
        milestone.status = 'completed'
        milestone.completed_at = datetime.utcnow()
        milestone.evidence_url = evidence_url
        milestone.verified_by = current_user.id if current_user.role in ['admin', 'reviewer'] else None
        
        db.session.commit()
        flash('Milestone marked as completed!', 'success')
        return redirect(url_for('project_detail', project_id=project_id))

    # --- ADMIN PIPELINE DRAG-AND-DROP ---
    
    @app.route('/admin/pipeline')
    @login_required
    def admin_pipeline():
        if current_user.role not in ['admin', 'reviewer']:
            flash('Access denied. Administrator privileges required.', 'error')
            return redirect(url_for('dashboard'))
            
        # Get all projects
        projects_all = Project.query.all()
        stages = [
            'submitted', 'screening', 'problem_validation', 
            'solution_viability', 'impact_assessment', 'prototype_review', 
            'commercialization', 'graduated'
        ]
        
        # Categorise projects by stage
        pipeline_data = {s: [] for s in stages}
        for p in projects_all:
            if p.stage in pipeline_data:
                pipeline_data[p.stage].append(p)
                
        return render_template('admin_pipeline.html', pipeline=pipeline_data, stages=stages)
        
    @app.route('/admin/pipeline/move', methods=['POST'])
    @login_required
    def admin_pipeline_move():
        if current_user.role not in ['admin', 'reviewer']:
            return jsonify({'error': 'Unauthorized'}), 403
            
        data = request.json or {}
        project_id = data.get('project_id')
        new_stage = data.get('stage')
        
        project = Project.query.get_or_404(project_id)
        old_stage = project.stage
        project.stage = new_stage
        
        # Create audit trail notification for user
        notif = Notification(
            user_id=project.owner_id,
            type='stage_advanced',
            title='Project Stage Advanced',
            body=f"Your project '{project.title}' has been moved from '{old_stage.replace('_', ' ').title()}' to '{new_stage.replace('_', ' ').title()}'.",
            link=url_for('project_detail', project_id=project.id)
        )
        db.session.add(notif)
        db.session.commit()
        
        return jsonify({
            'success': True, 
            'project_id': project.id, 
            'old_stage': old_stage, 
            'new_stage': new_stage
        })
        
    @app.route('/admin/scoring')
    @login_required
    def admin_scoring():
        if current_user.role not in ['admin', 'reviewer']:
            flash('Access denied.', 'error')
            return redirect(url_for('dashboard'))
            
        projects_list = Project.query.filter(Project.ai_score.isnot(None)).order_by(Project.ai_score.desc()).all()
        return render_template('admin_scoring.html', projects=projects_list)

    # --- AI AGENT ENDPOINTS ---
    
    @app.route('/api/ai/chat', methods=['POST'])
    @login_required
    def api_ai_chat():
        data = request.json or {}
        message = data.get('message', '')
        history = data.get('history', [])
        
        # Construct chatbot prompt
        system_prompt = (
            "You are the Mak-TIC Application Quality Assistant, an AI writing coach for the "
            "Makerere University Technology & Innovation Center portal. Your task is to review "
            "the draft proposals of innovators and offer specific, actionable feedback on how to "
            "improve their problem statement, solution design, and team alignment. Do not write the "
            "content for them; instead, act as a constructive writing coach. Keep responses short and friendly."
        )
        
        # Build prompt including chat history
        context = ""
        for turn in history[-4:]: # Keep last 4 turns for context
            role = "User" if turn.get('role') == 'user' else "Assistant"
            context += f"{role}: {turn.get('content')}\n"
        context += f"User: {message}\nAssistant:"
        
        response_text = call_gemini(context, system_instruction=system_prompt, response_json=False)
        
        return jsonify({
            'response': response_text
        })
        
    def trigger_ai_scoring(project_id):
        project = Project.query.get(project_id)
        if not project:
            return
            
        prompt = (
            f"Title: {project.title}\n"
            f"Track: {project.track}\n"
            f"Sector: {project.sector}\n"
            f"Description: {project.description}\n"
            f"Problem: {project.problem_statement}\n"
            f"Solution: {project.proposed_solution}\n"
            f"Support Needed: {project.support_needed}"
        )
        
        system_instruction = (
            "Evaluate this innovation project submission and return a JSON object with:\n"
            "1. score (number, 0-100)\n"
            "2. summary (string, 2-3 sentences)\n"
            "3. sdg_tags (array of integers from 1 to 17)\n"
            "4. sdg_reasoning (string describing why tags apply)\n"
            "5. strengths (array of strings, top 3 strengths)\n"
            "6. concerns (array of strings, top 3 concerns)\n"
            "7. recommended_support (array of strings)"
        )
        
        raw_response = call_gemini(prompt, system_instruction=system_instruction, response_json=True)
        
        try:
            ai_data = json.loads(raw_response)
            project.ai_score = ai_data.get('score', 70.0)
            project.ai_summary = ai_data.get('summary', '')
            sdg_tags_list = ai_data.get('sdg_tags', [])
            project.sdg_tags = ','.join(str(x) for x in sdg_tags_list)
            project.ai_sdg_reasoning = ai_data.get('sdg_reasoning', '')
            
            # Create a mock Stage Gate Review for the AI review
            ai_review = StageGateReview(
                project_id=project.id,
                reviewer_id=project.owner_id,  # Link to owner or system (using owner for RLS convenience in SQLite)
                gate='screening',
                score_impact=min(10, int(project.ai_score / 10) + 1),
                score_feasibility=min(10, int(project.ai_score / 10)),
                score_team=8,
                score_innovation=min(10, int(project.ai_score / 10) + 2),
                score_market=min(10, int(project.ai_score / 10)),
                weighted_total=project.ai_score / 10.0,
                comments=f"AI Scoring Agent Pre-evaluation Summary:\n{project.ai_summary}",
                recommendation='advance' if project.ai_score >= 60 else 'revise_resubmit',
                is_ai_review=True
            )
            db.session.add(ai_review)
            db.session.commit()
        except Exception as e:
            print(f"Error parsing AI scoring output: {e}. Raw response: {raw_response}")
            # Fallback values
            project.ai_score = 70.0
            project.ai_summary = "AI Evaluator failed to parse JSON, default score applied."
            project.sdg_tags = "9"
            db.session.commit()
            
    # Mark notification as read
    @app.route('/notifications/<notification_id>/read', methods=['POST'])
    @login_required
    def notification_read(notification_id):
        notif = Notification.query.get_or_404(notification_id)
        if notif.user_id != current_user.id:
            return jsonify({'error': 'Unauthorized'}), 403
            
        notif.read_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True})

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
