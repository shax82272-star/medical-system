from rest_framework import serializers
from django.contrib.auth.models import User
from .models import DoctorProfile, Patient, Diagnosis


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_staff', 'is_superuser']


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()
    specialty_display = serializers.SerializerMethodField()
    patients_count = serializers.SerializerMethodField()
    diagnoses_count = serializers.SerializerMethodField()

    class Meta:
        model = DoctorProfile
        fields = ['id', 'user', 'full_name', 'specialty', 'specialty_display', 'phone',
                  'bio', 'experience_years', 'patients_count', 'diagnoses_count', 'created_at']

    def get_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_specialty_display(self, obj):
        return obj.get_specialty_display()

    def get_patients_count(self, obj):
        return obj.patients.count()

    def get_diagnoses_count(self, obj):
        return obj.diagnoses.count()


class DoctorCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField(required=False, allow_blank=True)
    specialty = serializers.ChoiceField(choices=DoctorProfile.SPECIALTY_CHOICES)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    bio = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(min_value=0, default=0)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Bu username allaqachon mavjud.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
        )
        doctor = DoctorProfile.objects.create(
            user=user,
            specialty=validated_data.get('specialty', 'terapevt'),
            phone=validated_data.get('phone', ''),
            bio=validated_data.get('bio', ''),
            experience_years=validated_data.get('experience_years', 0),
        )
        return doctor


class PatientSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    gender_display = serializers.SerializerMethodField()
    blood_type_display = serializers.SerializerMethodField()
    diagnoses_count = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = Patient
        fields = ['id', 'doctor', 'doctor_name', 'first_name', 'last_name', 'gender',
                  'gender_display', 'date_of_birth', 'age', 'phone', 'address',
                  'blood_type', 'blood_type_display', 'allergies', 'notes',
                  'diagnoses_count', 'created_at', 'updated_at']
        read_only_fields = ['doctor', 'created_at', 'updated_at']

    def get_gender_display(self, obj):
        return obj.get_gender_display()

    def get_blood_type_display(self, obj):
        return obj.blood_type or '-'

    def get_diagnoses_count(self, obj):
        return obj.diagnoses.count()

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name()}"


class DiagnosisSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    severity_display = serializers.SerializerMethodField()
    patient_gender = serializers.SerializerMethodField()

    class Meta:
        model = Diagnosis
        fields = ['id', 'patient', 'patient_name', 'patient_gender', 'doctor', 'doctor_name',
                  'disease_name', 'icd_code', 'description', 'symptoms', 'treatment',
                  'medications', 'status', 'status_display', 'severity', 'severity_display',
                  'diagnosis_date', 'follow_up_date', 'created_at', 'updated_at']
        read_only_fields = ['doctor', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.get_full_name()

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.get_full_name()}"

    def get_status_display(self, obj):
        return obj.get_status_display()

    def get_severity_display(self, obj):
        return obj.get_severity_display()

    def get_patient_gender(self, obj):
        return obj.patient.gender
