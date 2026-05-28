from datetime import datetime, date, timedelta
from database import db
from models import User, Project, ProjectMember, ProjectMilestone, StageGateReview, Notification
from app import create_app  # Create app helper

def seed_database():
    print("Seeding database...")
    
    # 1. Clear existing database
    db.drop_all()
    db.create_all()
    
    # 2. Create Seed Users
    admin = User(
        email='admin@mak-tic.ac.ug',
        full_name='Dr. Florence Nakayi',
        role='admin',
        affiliation='makerere_staff',
        department='College of Engineering, Design, Art and Technology (CEDAT)',
        bio='Director of Makerere Technology & Innovation Center (Mak-TIC). Enthusiastic about technology transfer and incubation in East Africa.',
        onboarding_complete=True
    )
    admin.set_password('admin123')
    
    reviewer = User(
        email='reviewer@mak-tic.ac.ug',
        full_name='Prof. Arthur Ssewankambo',
        role='reviewer',
        affiliation='makerere_staff',
        department='College of Computing and Information Sciences (CoCIS)',
        bio='Senior evaluator and research supervisor at Makerere. Specializes in software architectures, IoT systems, and technology commercialization.',
        onboarding_complete=True
    )
    reviewer.set_password('reviewer123')
    
    innovator1 = User(
        email='innovator1@mak-tic.ac.ug',
        full_name='Kato John Bosco',
        role='innovator',
        affiliation='makerere_student',
        student_id='210071420',
        department='Department of Electrical and Computer Engineering',
        bio='Final year Electrical Engineering student passionate about low-cost agritech solutions and IoT sensors for smallholder farmers.',
        skills='Python, Arduino, Embedded Systems, Circuit Design, IoT',
        onboarding_complete=True
    )
    innovator1.set_password('innovator123')
    
    innovator2 = User(
        email='innovator2@mak-tic.ac.ug',
        full_name='Namubiru Sarah',
        role='innovator',
        affiliation='makerere_alumni',
        department='College of Natural Sciences (CoNAS)',
        bio='Biochemistry graduate. Developing biodegradable packaging solutions from agricultural waste material like banana stems (matooke).',
        skills='Biochemistry, Product Development, Material Science, Circular Economy',
        onboarding_complete=True
    )
    innovator2.set_password('innovator223')
    
    db.session.add_all([admin, reviewer, innovator1, innovator2])
    db.session.commit()
    
    # Refresh to get IDs
    db.session.refresh(admin)
    db.session.refresh(reviewer)
    db.session.refresh(innovator1)
    db.session.refresh(innovator2)
    
    # 3. Create Seed Projects
    
    # Project 1: AgriShield IoT System (Early Idea / Submitted)
    p1 = Project(
        title='AgriShield IoT System',
        slug='agrishield-iot-system-a1b2c3d4',
        description='An automated, low-cost sensor network designed for smallholder farmers in rural Uganda. It monitors soil moisture, ambient humidity, and temperature in real-time, then leverages MTN Mobile Money SMS services to send automated irrigation recommendations and alerts. The system uses solar power to run continuously in off-grid conditions.',
        problem_statement='Smallholder farmers in Uganda lose up to 40% of their crop yields to erratic rainfall and dry spells because they lack information on soil moisture content and irrigation timing. Existing commercial soil sensor networks are too expensive, require complex internet access (which is unavailable in rural areas), and do not integrate with accessible communication channels like basic SMS.',
        proposed_solution='AgriShield leverages cheap, durable moisture sensors connected to an ESP32 micro-controller and a GSM module. It operates off a tiny solar cell. The controller reads soil data hourly and runs an on-device threshold algorithm. If moisture drops below 20%, it sends a short SMS via MTN/Airtel networks directly to the farmer\'s simple phone, providing a clear irrigation action plan.',
        owner_id=innovator1.id,
        track='early_idea',
        sector='agritech, iot',
        sdg_tags='2,9,13',
        stage='submitted',
        status='active',
        support_needed='funding, mentorship, lab_access',
        ai_score=78.5,
        ai_summary='AgriShield proposes a highly feasible, low-cost solution addressing key agricultural constraints in Uganda. Combining basic SMS networks with ESP32 micro-controllers shows great hardware awareness. The primary risk lies in hardware distribution scaling and sensor calibration in varied soil conditions.',
        ai_sdg_reasoning='SDG 2 (Zero Hunger): Increases crop yields and food security. SDG 9 (Industry/Innovation): Integrates IoT hardware and infrastructure. SDG 13 (Climate Action): Helps farmers adapt to changing rain cycles.',
        is_public=True
    )
    
    # Project 2: Matooke Sap Paper (Prototype / Problem Validation)
    p2 = Project(
        title='Matooke Stem Biodegradable Paper',
        slug='matooke-stem-biodegradable-paper-e5f6g7h8',
        description='A mechanical and chemical extraction process that turns discarded banana (matooke) stems into high-quality, biodegradable packaging paper and boxes. Stems are currently agricultural waste. By harvesting the fiber from these stems, we create a sustainable alternative to single-use plastics and wood-pulp paper.',
        problem_statement='Ugandans consume millions of tons of matooke annually, leaving behind heaps of banana pseudostems that rot in piles or clog drainage systems in cities. At the same time, packaging needs are growing, leading to high import costs for paper bags and massive accumulation of plastic bags (kaveera) which damage the soil and environment.',
        proposed_solution='We have built a simple manual decorticator to extract long, strong fibers from fresh matooke stems. The fibers are cooked with sodium hydroxide to remove lignin, blended into a pulp, and pressed using canvas screens. The resulting paper is highly water-resistant due to natural waxes in banana fiber, making it suitable for shopping bags and food packages.',
        owner_id=innovator2.id,
        track='prototype',
        sector='bio-economy, materials',
        sdg_tags='12,15',
        stage='problem_validation',
        status='active',
        support_needed='funding, lab_access, ip_protection',
        ai_score=84.2,
        ai_summary='A very innovative circular-economy project utilizing an abundant agricultural waste product in Uganda. The prototype demonstrates clear viability, and the mechanical extraction method is low-impact. Challenges include drying speed in wet seasons and achieving uniform thickness for industrial packaging.',
        ai_sdg_reasoning='SDG 12 (Responsible Consumption & Production): Reuses waste stems to replace plastic packaging. SDG 15 (Life on Land): Reduces deforestation for paper products.',
        is_public=True
    )
    
    # Project 3: Mak-MoMo Pay (Market Ready / Commercialization)
    p3 = Project(
        title='Mak-MoMo Pay Merchant Engine',
        slug='mak-momo-pay-merchant-engine-i9j0k1l2',
        description='A unified payment API that aggregates MTN Mobile Money, Airtel Money, and card payments into a single endpoint for small-to-medium enterprises (SMEs) in Uganda. The platform provides simplified SDKs, flat-rate transaction pricing (1%), and auto-settlement to bank accounts within 12 hours.',
        problem_statement='Micro-merchants and student entrepreneurs in Uganda struggle to accept digital payments. The official MTN and Airtel payment gateways have slow onboarding, require high security deposits, demand complex SOAP XML integrations, and charge up to 3% per transaction, which eats into tiny retail margins.',
        proposed_solution='Mak-MoMo Pay offers a modern REST API with single-line SDKs in Python, Node, and PHP. It provides a simple pre-built checkout page that merchants can link from their websites or WhatsApp chats. We negotiate bulk volume discounts with telcos to lower transactional costs and pass the savings back to small businesses.',
        owner_id=innovator1.id,
        track='market_ready',
        sector='fintech, software',
        sdg_tags='8,9',
        stage='commercialization',
        status='active',
        support_needed='funding, networking, technical_training',
        ai_score=91.0,
        ai_summary='High potential fintech project solving a clear merchant friction point in Uganda. The API simplifies telco integration significantly. Well-aligned with local transaction habits. The key risk is navigating Bank of Uganda payment sandbox regulations.',
        ai_sdg_reasoning='SDG 8 (Decent Work & Economic Growth): Simplifies financial transactions for micro-businesses, fostering growth. SDG 9 (Industry/Innovation): Builds digital payment infrastructure.',
        is_public=True
    )
    
    db.session.add_all([p1, p2, p3])
    db.session.commit()
    
    # Refresh to get IDs
    db.session.refresh(p1)
    db.session.refresh(p2)
    db.session.refresh(p3)
    
    # 4. Add Project Members
    m1 = ProjectMember(project_id=p1.id, user_id=innovator1.id, role='lead')
    m2 = ProjectMember(project_id=p2.id, user_id=innovator2.id, role='lead')
    m3 = ProjectMember(project_id=p3.id, user_id=innovator1.id, role='lead')
    # Add Kato John Bosco as member of Matooke Sap Paper to help with electronics
    m4 = ProjectMember(project_id=p2.id, user_id=innovator1.id, role='member')
    
    db.session.add_all([m1, m2, m3, m4])
    
    # 5. Add Project Milestones for Matooke Sap Paper (p2)
    ms1 = ProjectMilestone(
        project_id=p2.id,
        title='Decorticator Prototype Assembly',
        description='Assemble the manual pseudostem decorticating drum with custom steel blades to peel outer sheath fibers safely.',
        due_date=date.today() - timedelta(days=15),
        completed_at=datetime.utcnow() - timedelta(days=16),
        evidence_url='https://storage.googleapis.com/mak-tic-bucket/decorticator_v1.jpg',
        verified_by=admin.id,
        status='completed'
    )
    
    ms2 = ProjectMilestone(
        project_id=p2.id,
        title='Tensile Strength Testing',
        description='Test sheets in CEDAT Materials Lab to measure maximum tearing index and tensile strength under moisture.',
        due_date=date.today() + timedelta(days=20),
        status='in_progress'
    )
    
    ms3 = ProjectMilestone(
        project_id=p2.id,
        title='Funder Presentation Pitch Deck',
        description='Create business viability charts and pitch deck slide package for UNDP Timbuktoo grant submission.',
        due_date=date.today() - timedelta(days=2),
        status='overdue'
    )
    
    db.session.add_all([ms1, ms2, ms3])
    
    # 6. Add Reviews for Matooke Sap Paper (p2) at Screening and Problem Validation Gate
    rev1 = StageGateReview(
        project_id=p2.id,
        reviewer_id=reviewer.id,
        gate='screening',
        score_impact=8,
        score_feasibility=9,
        score_team=8,
        score_innovation=9,
        score_market=7,
        weighted_total=8.2,
        comments='This is a brilliant initiative. The team has demonstrated a practical approach to extracting fiber. I recommend advancing them to the validation gate.',
        recommendation='advance',
        is_ai_review=False
    )
    
    rev_ai = StageGateReview(
        project_id=p2.id,
        reviewer_id=admin.id,  # Admin acts as system/AI container in SQLite schema
        gate='screening',
        score_impact=9,
        score_feasibility=8,
        score_team=8,
        score_innovation=9,
        score_market=8,
        weighted_total=8.4,
        comments='AI Pre-evaluation: Strong environmental impact alignment. Novel use of banan pseudostems. Recommend standard screening approval.',
        recommendation='advance',
        is_ai_review=True
    )
    
    db.session.add_all([rev1, rev_ai])
    
    # 7. Add Notifications
    n1 = Notification(
        user_id=innovator1.id,
        type='stage_advanced',
        title='AgriShield Submitted',
        body='Your project AgriShield IoT System was successfully submitted and evaluated by our AI Scorer. It received an initial score of 78.5.',
        link=f'/projects/{p1.id}',
        created_at=datetime.utcnow() - timedelta(days=2)
    )
    
    n2 = Notification(
        user_id=innovator2.id,
        type='review_assigned',
        title='Milestone Overdue',
        body='Your milestone "Funder Presentation Pitch Deck" is past its due date. Please upload evidence or update the schedule.',
        link=f'/projects/{p2.id}',
        created_at=datetime.utcnow() - timedelta(hours=5)
    )
    
    db.session.add_all([n1, n2])
    db.session.commit()
    
    print("Database seeding completed successfully.")

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        seed_database()
