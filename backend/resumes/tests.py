from rest_framework.test import APITestCase
from users.models import User
from django.core.files.uploadedfile import SimpleUploadedFile

class ResumeUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create(email="uploader@example.com", first_name="Uploader")

    def test_invalid_file_extension(self):
        self.client.force_authenticate(user=self.user)
        invalid_file = SimpleUploadedFile("test.txt", b"file_content", content_type="text/plain")
        response = self.client.post("/api/resumes/upload/", {"file": invalid_file}, format='multipart')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file format", response.data['error'])
        
    def test_file_size_limit(self):
        self.client.force_authenticate(user=self.user)
        # 6MB mock file
        large_file = SimpleUploadedFile("large.pdf", b"0" * (6 * 1024 * 1024), content_type="application/pdf")
        response = self.client.post("/api/resumes/upload/", {"file": large_file}, format='multipart')
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("exceeds the 5MB size limit", response.data['error'])
