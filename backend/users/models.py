from djongo import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

class User(AbstractBaseUser):
    # Using djongo ObjectIdField as the primary key
    _id = models.ObjectIdField()
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255)
    auth_provider = models.CharField(max_length=50, default='google')
    
    # Onboarding Fields
    linkedin_url = models.URLField(blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    current_company = models.CharField(max_length=255, blank=True, null=True)
    onboarding_completed = models.BooleanField(default=False)
    
    # Pricing & Limits
    TIER_CHOICES = [
        ('free', 'Free'),
        ('basic', 'Basic'),     # $9
        ('pro', 'Pro'),         # $29
        ('premium', 'Premium')  # $49
    ]
    pricing_tier = models.CharField(max_length=20, choices=TIER_CHOICES, default='free')
    tokens_remaining = models.IntegerField(default=10)
    
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name']

    @property
    def id(self):
        """Alias for _id so that SimpleJWT and Django internals can access user.id"""
        return self._id

    @property
    def pk(self):
        """Alias for _id so that Django ORM and SimpleJWT can access user.pk"""
        return self._id

    @property
    def can_generate_cover_letter(self):
        return self.pricing_tier in ['free', 'pro', 'premium']

    @property
    def can_generate_cold_email(self):
        return self.pricing_tier in ['free', 'premium']

    def __str__(self):
        return self.email
