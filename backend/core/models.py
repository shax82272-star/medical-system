from django.db import models
from django.contrib.auth.models import User


class DoctorProfile(models.Model):
    SPECIALTY_CHOICES = [
        ('terapevt', 'Terapevt'),
        ('kardiolog', 'Kardiolog'),
        ('nevrolog', 'Nevrolog'),
        ('xirurg', 'Xirurg'),
        ('oftalmolog', 'Oftalmolog'),
        ('dermatolog', 'Dermatolog'),
        ('pediatr', 'Pediatr'),
        ('ginekolog', 'Ginekolog'),
        ('ortoped', 'Ortoped'),
        ('endokrinolog', 'Endokrinolog'),
        ('pulmonolog', 'Pulmonolog'),
        ('gastroenterolog', 'Gastroenterolog'),
        ('psixiatr', 'Psixiatr'),
        ('urolog', 'Urolog'),
        ('onkolog', 'Onkolog'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.CharField(max_length=100, choices=SPECIALTY_CHOICES, default='terapevt')
    phone = models.CharField(max_length=20, blank=True)
    bio = models.TextField(blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Dr. {self.user.get_full_name()} - {self.get_specialty_display()}"

    class Meta:
        verbose_name = 'Doktor profili'
        verbose_name_plural = 'Doktor profillari'


class Patient(models.Model):
    GENDER_CHOICES = [
        ('erkak', 'Erkak'),
        ('ayol', 'Ayol'),
    ]
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A(II)+'),
        ('A-', 'A(II)-'),
        ('B+', 'B(III)+'),
        ('B-', 'B(III)-'),
        ('AB+', 'AB(IV)+'),
        ('AB-', 'AB(IV)-'),
        ('O+', 'O(I)+'),
        ('O-', 'O(I)-'),
    ]

    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='patients')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES, blank=True)
    allergies = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )

    class Meta:
        verbose_name = 'Bemor'
        verbose_name_plural = 'Bemorlar'
        ordering = ['-created_at']


class Diagnosis(models.Model):
    STATUS_CHOICES = [
        ('yangi', 'Yangi'),
        ('davolanyapti', 'Davolanyapti'),
        ('yaxshilandi', 'Yaxshilandi'),
        ('tuzaldi', 'Tuzaldi'),
        ('surunkali', 'Surunkali'),
    ]
    SEVERITY_CHOICES = [
        ('engil', 'Engil'),
        ('orta', "O'rta"),
        ('ogir', "Og'ir"),
        ('juda_ogir', "Juda og'ir"),
    ]

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='diagnoses')
    doctor = models.ForeignKey(DoctorProfile, on_delete=models.CASCADE, related_name='diagnoses')
    disease_name = models.CharField(max_length=200)
    icd_code = models.CharField(max_length=20, blank=True)
    description = models.TextField()
    symptoms = models.TextField(blank=True)
    treatment = models.TextField(blank=True)
    medications = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='yangi')
    severity = models.CharField(max_length=20, choices=SEVERITY_CHOICES, default='orta')
    diagnosis_date = models.DateField()
    follow_up_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.disease_name}"

    class Meta:
        verbose_name = 'Tashxis'
        verbose_name_plural = 'Tashxislar'
        ordering = ['-created_at']
