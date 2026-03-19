from rest_framework.test import APITestCase
from users.models import User
from resumes.models import Resume

class AIOptimizationTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create(email="test@example.com", first_name="Test", tokens_remaining=0)
        self.resume = Resume.objects.create(user=self.user, parsed_data={"skills": []})

    def test_optimization_fails_without_tokens(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/optimize/", {
            "resume_id": str(self.resume.pk),
            "job_description": "We need a Python developer."
        })
        self.assertEqual(response.status_code, 402)
        self.assertIn("Insufficient tokens", response.data['error'])
        
    def test_optimization_succeeds_with_tokens(self):
        self.user.tokens_remaining = 2
        self.user.save()
        self.client.force_authenticate(user=self.user)
        response = self.client.post("/api/optimize/", {
            "resume_id": str(self.resume.pk),
            "job_description": "We need a Python developer."
        })
        self.assertEqual(response.status_code, 202)
        self.assertIn("task_id", response.data)
        
        # Verify token was deducted
        self.user.refresh_from_db()
        self.assertEqual(self.user.tokens_remaining, 1)
