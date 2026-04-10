"""
Career pipeline models.

Three models for the Career-Ops integration:
  JobListing     — Discovered job from portal scanning
  CareerProfile  — User's targeting config (maps to portals.yml)
  PipelineRun    — Tracks async pipeline executions
"""

from djongo import models
from django.conf import settings


class CareerProfile(models.Model):
    """
    User's career targeting configuration.

    Stores the equivalent of Career-Ops' portals.yml + profile.yml
    in the database for multi-tenant SaaS operation.
    """
    _id = models.ObjectIdField()
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='career_profile',
    )

    # Targeting
    target_roles = models.JSONField(
        default=list,
        blank=True,
        help_text='Target role titles, e.g. ["AI Engineer", "ML Engineer"]',
    )
    target_companies = models.JSONField(
        default=list,
        blank=True,
        help_text='List of company configs: [{name, careers_url, api?, enabled}]',
    )
    excluded_keywords = models.JSONField(
        default=list,
        blank=True,
        help_text='Title keywords to exclude, e.g. ["intern", "junior"]',
    )

    # Preferences
    salary_range = models.JSONField(
        default=dict,
        blank=True,
        help_text='Compensation targets: {min, max, currency}',
    )
    location_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text='Location settings: {remote: bool, cities: [], countries: []}',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        roles = ", ".join(self.target_roles[:3]) if self.target_roles else "No targets"
        return f"CareerProfile({self.user.email}: {roles})"

    def to_portals_config(self) -> dict:
        """Convert to the format expected by career_ops_service.scan_jobs()."""
        return {
            "target_roles": self.target_roles,
            "target_companies": self.target_companies,
            "excluded_keywords": self.excluded_keywords,
        }

    class Meta:
        verbose_name = "Career Profile"
        verbose_name_plural = "Career Profiles"


class JobListing(models.Model):
    """
    A discovered job listing from portal scanning or manual entry.

    Maps to Career-Ops' pipeline.md + applications.md tracker entries.
    """

    STATUS_CHOICES = [
        ("new", "New"),
        ("evaluated", "Evaluated"),
        ("applied", "Applied"),
        ("responded", "Responded"),
        ("interview", "Interview"),
        ("offer", "Offer"),
        ("rejected", "Rejected"),
        ("discarded", "Discarded"),
        ("skipped", "Skipped"),
    ]

    RECOMMENDATION_CHOICES = [
        ("apply", "Apply"),
        ("skip", "Skip"),
        ("maybe", "Maybe"),
    ]

    _id = models.ObjectIdField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='job_listings',
    )

    # Core job info
    company = models.CharField(max_length=255)
    role = models.CharField(max_length=500)
    url = models.URLField(max_length=1000, blank=True)
    location = models.CharField(max_length=255, blank=True)
    source = models.CharField(
        max_length=50,
        blank=True,
        help_text='Discovery source: greenhouse-api, lever-api, ashby-api, manual',
    )
    raw_jd = models.TextField(blank=True, help_text='Raw job description text')

    # Evaluation results (from Career AI)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="new")
    score = models.FloatField(null=True, blank=True, help_text='Fit score 0-5')
    fit_summary = models.TextField(blank=True)
    recommendation = models.CharField(
        max_length=10,
        choices=RECOMMENDATION_CHOICES,
        default="maybe",
    )
    archetype = models.CharField(max_length=100, blank=True, help_text='Role archetype detected')
    evaluation_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='Full A-F evaluation results',
    )

    # PDF generation
    resume_pdf_url = models.CharField(max_length=500, blank=True)

    # Timestamps
    discovered_at = models.DateTimeField(auto_now_add=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        score_str = f"{self.score:.1f}/5" if self.score else "—"
        return f"{self.company} — {self.role} [{score_str}]"

    class Meta:
        ordering = ['-discovered_at']
        verbose_name = "Job Listing"
        verbose_name_plural = "Job Listings"
        # Prevent duplicate company+role for same user
        unique_together = [('user', 'company', 'role')]


class PipelineRun(models.Model):
    """
    Tracks async Career-Ops pipeline executions.

    Each run represents a background task (scan, evaluate, pdf, batch)
    and its current status. Used for polling from the frontend.
    """

    RUN_TYPE_CHOICES = [
        ("scan", "Portal Scan"),
        ("evaluate", "Job Evaluation"),
        ("pdf", "PDF Generation"),
        ("batch", "Batch Evaluation"),
        ("optimize", "Full Pipeline"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("running", "Running"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    ]

    _id = models.ObjectIdField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pipeline_runs',
    )

    run_type = models.CharField(max_length=20, choices=RUN_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    celery_task_id = models.CharField(max_length=255, blank=True, help_text='Celery async task ID')

    # Input/output
    input_data = models.JSONField(default=dict, blank=True)
    output_data = models.JSONField(default=dict, blank=True)
    error = models.TextField(blank=True)

    # Timing
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.run_type} [{self.status}] — {self.user.email}"

    class Meta:
        ordering = ['-started_at']
        verbose_name = "Pipeline Run"
        verbose_name_plural = "Pipeline Runs"


class ApplicationAssets(models.Model):
    """
    Stores generated assets associated with a specific job application.
    """
    _id = models.ObjectIdField()
    resume_version = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="The specific tuned resume version used"
    )
    cover_letter = models.TextField(blank=True, help_text="Generated cover letter text")
    cold_email = models.TextField(blank=True, help_text="Generated cold email text")
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assets for Resume ID {self.resume_version_id if self.resume_version else 'None'}"

class Application(models.Model):
    """
    Tracks a user's job application from start to finish.
    """
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("applied", "Applied"),
        ("interview", "Interviewing"),
        ("offer", "Offer Received"),
        ("rejected", "Rejected"),
        ("withdrawn", "Withdrawn")
    ]
    
    _id = models.ObjectIdField()
    job = models.ForeignKey(
        'JobListing',
        on_delete=models.CASCADE,
        related_name='applications'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='applications'
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    
    assets = models.ForeignKey(
        ApplicationAssets,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    # Snapshot links (in case the linked objects get deleted, we should ideally keep the text)
    # Keeping it simple as requested
    resume_used = models.ForeignKey(
        'resumes.Resume',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    cover_letter_used = models.TextField(blank=True)
    
    applied_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Application to {self.job.company} by {self.user.email} - {self.status}"
    
    class Meta:
        ordering = ['-applied_at', '-created_at']
        unique_together = [('user', 'job')]

