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

    # ATS scoring
    score = models.IntegerField(default=0)
    original_score = models.IntegerField(default=0)
    score_improvement = models.IntegerField(default=0)
    matching_skills = models.JSONField(default=list, blank=True)
    missing_skills = models.JSONField(default=list, blank=True)
    strengths = models.JSONField(default=list, blank=True)
    gaps = models.JSONField(default=list, blank=True)
    rationale = models.TextField(blank=True, default="")
    recommendation = models.TextField(blank=True, default="")

    changes = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Optimization for {self.user.email} - Score: {self.score}"

    class Meta:
        ordering = ['-created_at']
