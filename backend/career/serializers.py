"""
Serializers for the Career pipeline API.

JSON-only output contract — all responses are structured JSON.
All outputs include matched_score (0-100) and recommendation (APPLY/CONSIDER/SKIP).
"""

from rest_framework import serializers
from .models import CareerProfile, JobListing, PipelineRun


class CareerProfileSerializer(serializers.ModelSerializer):
    """Serialize career targeting configuration."""

    class Meta:
        model = CareerProfile
        fields = [
            'target_roles',
            'target_companies',
            'excluded_keywords',
            'salary_range',
            'location_preferences',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


class PipelineRunSerializer(serializers.ModelSerializer):
    """Serialize pipeline run status."""
    id = serializers.SerializerMethodField()

    class Meta:
        model = PipelineRun
        fields = [
            'id',
            'run_type',
            'status',
            'celery_task_id',
            'input_data',
            'output_data',
            'error',
            'started_at',
            'completed_at',
        ]
        read_only_fields = ['id', 'started_at', 'completed_at']

    def get_id(self, obj):
        return str(obj.pk)


class JobListingSerializer(serializers.ModelSerializer):
    """Full serialize a job listing (includes evaluation_data)."""
    id = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    display_recommendation = serializers.SerializerMethodField()
    missing_skills = serializers.SerializerMethodField()

    class Meta:
        model = JobListing
        fields = [
            'id',
            'company',
            'role',
            'url',
            'location',
            'source',
            'raw_jd',
            'status',
            'score',
            'match_score',
            'fit_summary',
            'recommendation',
            'display_recommendation',
            'archetype',
            'evaluation_data',
            'missing_skills',
            'resume_pdf_url',
            'discovered_at',
            'evaluated_at',
        ]
        read_only_fields = [
            'id', 'discovered_at', 'evaluated_at',
            'score', 'fit_summary', 'recommendation',
            'archetype', 'evaluation_data', 'resume_pdf_url',
        ]

    def get_id(self, obj):
        return str(obj.pk)

    def get_match_score(self, obj):
        """Return 0-100 score from evaluation_data, or convert from 0-5 legacy."""
        if obj.evaluation_data and isinstance(obj.evaluation_data, dict):
            ms = obj.evaluation_data.get("match_score")
            if ms is not None:
                return int(ms)
        if obj.score is not None:
            return int(obj.score * 20)  # Convert 0-5 → 0-100
        return None

    def get_display_recommendation(self, obj):
        """Return user-facing recommendation string."""
        if obj.evaluation_data and isinstance(obj.evaluation_data, dict):
            rec = obj.evaluation_data.get("recommendation")
            if rec:
                return rec.upper()
        # Fallback from model field
        mapping = {"apply": "APPLY", "maybe": "CONSIDER", "skip": "SKIP"}
        return mapping.get(obj.recommendation, "—")

    def get_missing_skills(self, obj):
        """Extract missing_skills from evaluation_data."""
        if obj.evaluation_data and isinstance(obj.evaluation_data, dict):
            return obj.evaluation_data.get("missing_skills",
                   obj.evaluation_data.get("gaps", []))
        return []


class JobListingSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for job listing cards (no evaluation_data, no raw_jd)."""
    id = serializers.SerializerMethodField()
    match_score = serializers.SerializerMethodField()
    display_recommendation = serializers.SerializerMethodField()

    class Meta:
        model = JobListing
        fields = [
            'id',
            'company',
            'role',
            'url',
            'location',
            'source',
            'status',
            'score',
            'match_score',
            'fit_summary',
            'recommendation',
            'display_recommendation',
            'archetype',
            'resume_pdf_url',
            'discovered_at',
            'evaluated_at',
        ]

    def get_id(self, obj):
        return str(obj.pk)

    def get_match_score(self, obj):
        if obj.evaluation_data and isinstance(obj.evaluation_data, dict):
            ms = obj.evaluation_data.get("match_score")
            if ms is not None:
                return int(ms)
        if obj.score is not None:
            return int(obj.score * 20)
        return None

    def get_display_recommendation(self, obj):
        if obj.evaluation_data and isinstance(obj.evaluation_data, dict):
            rec = obj.evaluation_data.get("recommendation")
            if rec:
                return rec.upper()
        mapping = {"apply": "APPLY", "maybe": "CONSIDER", "skip": "SKIP"}
        return mapping.get(obj.recommendation, "—")


# ---------------------------------------------------------------------------
# Input serializers (for request validation)
# ---------------------------------------------------------------------------

class ScanRequestSerializer(serializers.Serializer):
    """Validate scan request input."""
    dry_run = serializers.BooleanField(default=False, required=False)


class EvaluateRequestSerializer(serializers.Serializer):
    """Validate evaluate request input."""
    job_listing_id = serializers.CharField(required=False, help_text='ID of existing job listing')
    job_url = serializers.URLField(required=False, help_text='URL of job to evaluate')
    job_description = serializers.CharField(required=False, help_text='Raw JD text to evaluate')
    company = serializers.CharField(required=False, default="Unknown", help_text='Company name')
    role = serializers.CharField(required=False, default="Unknown Role", help_text='Role title')
    resume_id = serializers.CharField(required=False, help_text='Resume to evaluate against')

    def validate(self, data):
        if not data.get('job_listing_id') and not data.get('job_url') and not data.get('job_description'):
            raise serializers.ValidationError(
                "At least one of job_listing_id, job_url, or job_description is required."
            )
        return data


class OptimizeRequestSerializer(serializers.Serializer):
    """Validate full pipeline request input."""
    job_listing_id = serializers.CharField(required=True)
    resume_id = serializers.CharField(required=False)


from .models import Application, ApplicationAssets

class ApplicationAssetsSerializer(serializers.ModelSerializer):
    """Serialize ApplicationAssets."""
    class Meta:
        model = ApplicationAssets
        fields = '__all__'


class ApplicationSerializer(serializers.ModelSerializer):
    """Serialize Application tracker entries."""
    id = serializers.SerializerMethodField()
    job_details = serializers.SerializerMethodField()
    assets_details = ApplicationAssetsSerializer(source='assets', read_only=True)
    
    class Meta:
        model = Application
        fields = [
            'id', 'job', 'user', 'status', 'assets', 'resume_used',
            'cover_letter_used', 'applied_at', 'created_at', 'updated_at', 'job_details', 'assets_details'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_id(self, obj):
        return str(obj.pk)

    def get_job_details(self, obj):
        if obj.job:
            return JobListingSummarySerializer(obj.job).data
        return None

