from djongo import models
from django.conf import settings


class Resume(models.Model):
    _id = models.ObjectIdField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='resumes')
    file = models.FileField(upload_to='resumes/', blank=True, null=True)
    file_name = models.CharField(max_length=255, default="Untitled Resume")
    title = models.CharField(max_length=255, default="Untitled Resume")
    parsed_data = models.JSONField(null=True, blank=True)
    structured_data = models.JSONField(null=True, blank=True)  # Rich structured schema
    version = models.IntegerField(default=1)
    parent_resume_id = models.CharField(max_length=255, blank=True, null=True)  # For versioning/cloning
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.email} - {self.title} (v{self.version})"

    class Meta:
        ordering = ['-updated_at']
