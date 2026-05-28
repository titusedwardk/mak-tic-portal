import unittest
import os
from app import create_app
from database import db
from models import User, Project, ProjectMember

class MakTicPortalTestCase(unittest.TestCase):
    
    def setUp(self):
        # Configure app for testing
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['WTF_CSRF_ENABLED'] = False
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app.config['USE_GEMINI_SIMULATOR'] = True  # Ensure tests use simulator to avoid API hits
        
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
            
            # Create a test admin user
            self.admin = User(email='admin@test.com', full_name='Test Admin', role='admin')
            self.admin.set_password('password123')
            
            # Create a test innovator user
            self.innovator = User(email='innovator@test.com', full_name='Test Innovator', role='innovator')
            self.innovator.set_password('password123')
            
            db.session.add_all([self.admin, self.innovator])
            db.session.commit()
            
    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
            
    def login(self, email, password):
        return self.client.post('/login', data=dict(
            email=email,
            password=password
        ), follow_redirects=True)
        
    def logout(self):
        return self.client.get('/logout', follow_redirects=True)
        
    # --- TEST CASES ---
    
    def test_login_logout(self):
        # Test valid login
        response = self.login('innovator@test.com', 'password123')
        self.assertIn(b'Welcome', response.data)
        
        # Test invalid login
        self.logout()
        response = self.login('innovator@test.com', 'wrongpassword')
        self.assertIn(b'Invalid email', response.data)
        
    def test_registration(self):
        # Test new user signup
        response = self.client.post('/register', data=dict(
            email='newuser@test.com',
            password='newpassword',
            full_name='New User',
            role='innovator',
            affiliation='makerere_student',
            student_id='21005555',
            department='Computing',
            bio='Student researcher.',
            skills='Python, SQL',
            phone='+256772000000'
        ), follow_redirects=True)
        
        self.assertIn(b'Welcome', response.data)
        
        with self.app.app_context():
            user = User.query.filter_by(email='newuser@test.com').first()
            self.assertIsNotNone(user)
            self.assertEqual(user.full_name, 'New User')
            
    def test_role_access_restriction(self):
        # Log in as innovator
        self.login('innovator@test.com', 'password123')
        
        # Attempt to access admin pipeline
        response = self.client.get('/admin/pipeline', follow_redirects=True)
        self.assertIn(b'Access denied', response.data)
        
        # Log in as admin
        self.logout()
        self.login('admin@test.com', 'password123')
        
        # Access admin pipeline
        response = self.client.get('/admin/pipeline')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Stage Gate Review Pipeline', response.data)
        
    def test_project_submission_and_scoring(self):
        self.login('innovator@test.com', 'password123')
        
        # Submit new project
        response = self.client.post('/projects/new', data=dict(
            title='IoT Water Pump',
            track='prototype',
            sector='agritech, iot',
            description='Automated water pump sensor.',
            problem_statement='Lack of water management.',
            proposed_solution='ESP32 controller and relay.',
            support_needed='funding',
            is_public=True
        ), follow_redirects=True)
        
        self.assertIn(b'submitted successfully', response.data)
        
        # Verify project is saved and has AI score populated (triggered automatically in submission route)
        with self.app.app_context():
            project = Project.query.filter_by(title='IoT Water Pump').first()
            self.assertIsNotNone(project)
            self.assertEqual(project.track, 'prototype')
            # Scorer should have run
            self.assertIsNotNone(project.ai_score)
            self.assertGreater(project.ai_score, 0)
            self.assertIsNotNone(project.ai_summary)

if __name__ == '__main__':
    unittest.main()
