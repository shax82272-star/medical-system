from django.contrib import admin
from .models import DoctorProfile, Patient, Diagnosis


@admin.register(DoctorProfile)
class DoctorProfileAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'specialty', 'phone', 'experience_years', 'created_at']
    list_filter = ['specialty']
    search_fields = ['user__first_name', 'user__last_name', 'user__username']


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ['get_full_name', 'gender', 'date_of_birth', 'doctor', 'phone', 'created_at']
    list_filter = ['gender', 'blood_type', 'doctor']
    search_fields = ['first_name', 'last_name', 'phone']


@admin.register(Diagnosis)
class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'doctor', 'status', 'severity', 'diagnosis_date']
    list_filter = ['status', 'severity', 'doctor']
    search_fields = ['disease_name', 'patient__first_name', 'patient__last_name']
