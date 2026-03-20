from djongo import models
from django.conf import settings
from resumes.models import Resume

class OptimizationHistory(models.Model):
    _id = models.ObjectIdField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE)
    job_description = models.TextField()
    optimized_resume = models.TextField()
    cover_letter = models.TextField(blank=True, null=True)
    cold_email = models.TextField(blank=True, null=True)
    score = models.IntegerField()
    changes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Optimization for {self.user.email} - Score: {self.score}"
