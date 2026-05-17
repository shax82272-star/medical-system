from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Count, Q
from datetime import datetime, timedelta
from .models import DoctorProfile, Patient, Diagnosis
from .serializers import (
    DoctorProfileSerializer, DoctorCreateSerializer,
    PatientSerializer, DiagnosisSerializer, UserSerializer
)
import os
import numpy as np
from PIL import Image
import io
from tensorflow.keras.applications.efficientnet import preprocess_input as efficientnet_preprocess

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_staff or request.user.is_superuser)


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'doctor_profile')


class IsAdminOrDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            role = 'admin' if (user.is_staff or user.is_superuser) else 'doctor'
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'role': role,
            })
        return Response({'error': "Noto'g'ri username yoki parol"}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({'message': 'Tizimdan chiqdingiz'})


class MeView(APIView):
    def get(self, request):
        user = request.user
        role = 'admin' if (user.is_staff or user.is_superuser) else 'doctor'
        data = UserSerializer(user).data
        data['role'] = role
        if hasattr(user, 'doctor_profile'):
            data['doctor_profile'] = DoctorProfileSerializer(user.doctor_profile).data
        return Response(data)


class DoctorListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdmin]
    queryset = DoctorProfile.objects.select_related('user').all()
    serializer_class = DoctorProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = DoctorCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        doctor = serializer.save()
        return Response(DoctorProfileSerializer(doctor).data, status=status.HTTP_201_CREATED)


class DoctorDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdmin]
    queryset = DoctorProfile.objects.select_related('user').all()
    serializer_class = DoctorProfileSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PatientListCreateView(generics.ListCreateAPIView):
    serializer_class = PatientSerializer

    def get_permissions(self):
        return [IsAdminOrDoctor()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Patient.objects.select_related('doctor__user').all()
        elif hasattr(user, 'doctor_profile'):
            return Patient.objects.filter(doctor=user.doctor_profile).select_related('doctor__user')
        return Patient.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'doctor_profile'):
            serializer.save(doctor=user.doctor_profile)
        else:
            raise permissions.PermissionDenied("Faqat doktorlar bemor qo'sha oladi")


class PatientDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PatientSerializer

    def get_permissions(self):
        return [IsAdminOrDoctor()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Patient.objects.select_related('doctor__user').all()
        elif hasattr(user, 'doctor_profile'):
            return Patient.objects.filter(doctor=user.doctor_profile).select_related('doctor__user')
        return Patient.objects.none()


class DiagnosisListCreateView(generics.ListCreateAPIView):
    serializer_class = DiagnosisSerializer

    def get_permissions(self):
        return [IsAdminOrDoctor()]

    def get_queryset(self):
        user = self.request.user
        qs = Diagnosis.objects.select_related('patient', 'doctor__user')
        if user.is_staff or user.is_superuser:
            pass
        elif hasattr(user, 'doctor_profile'):
            qs = qs.filter(doctor=user.doctor_profile)
        else:
            return Diagnosis.objects.none()
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'doctor_profile'):
            patient = serializer.validated_data.get('patient')
            if patient.doctor != user.doctor_profile:
                raise permissions.PermissionDenied("Bu bemor sizniki emas")
            serializer.save(doctor=user.doctor_profile)
        else:
            raise permissions.PermissionDenied("Faqat doktorlar tashxis qo'sha oladi")


class DiagnosisDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DiagnosisSerializer

    def get_permissions(self):
        return [IsAdminOrDoctor()]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff or user.is_superuser:
            return Diagnosis.objects.select_related('patient', 'doctor__user').all()
        elif hasattr(user, 'doctor_profile'):
            return Diagnosis.objects.filter(doctor=user.doctor_profile).select_related('patient', 'doctor__user')
        return Diagnosis.objects.none()


class StatisticsView(APIView):
    permission_classes = [IsAdminOrDoctor]

    def get(self, request):
        user = request.user
        is_admin = user.is_staff or user.is_superuser

        if is_admin:
            patients_qs = Patient.objects.all()
            diagnoses_qs = Diagnosis.objects.all()
            doctors_count = DoctorProfile.objects.count()
        else:
            if not hasattr(user, 'doctor_profile'):
                return Response({'error': "Ruxsat yo'q"}, status=403)
            dp = user.doctor_profile
            patients_qs = Patient.objects.filter(doctor=dp)
            diagnoses_qs = Diagnosis.objects.filter(doctor=dp)
            doctors_count = 1

        from datetime import date as date_obj
        today_date = date_obj.today()
        try:
            child_cutoff = today_date.replace(year=today_date.year - 6)
        except ValueError:
            child_cutoff = today_date.replace(year=today_date.year - 6, day=28)

        total_patients = patients_qs.count()
        total_diagnoses = diagnoses_qs.count()
        active_diagnoses = diagnoses_qs.filter(status__in=['yangi', 'davolanyapti']).count()
        child_count = patients_qs.filter(date_of_birth__gt=child_cutoff).count()
        male_count = patients_qs.filter(gender='erkak', date_of_birth__lte=child_cutoff).count()
        female_count = patients_qs.filter(gender='ayol', date_of_birth__lte=child_cutoff).count()

        disease_stats = list(
            diagnoses_qs.values('disease_name')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        today = datetime.today()
        weekday_stats = []
        days_uz = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']
        for i in range(7):
            day = today - timedelta(days=today.weekday()) + timedelta(days=i)
            count = diagnoses_qs.filter(
                diagnosis_date__year=day.year,
                diagnosis_date__month=day.month,
                diagnosis_date__day=day.day,
            ).count()
            weekday_stats.append({'day': days_uz[i], 'count': count})

        months_uz = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
                     'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr']
        monthly_stats = []
        for i in range(12):
            count = diagnoses_qs.filter(
                diagnosis_date__year=today.year,
                diagnosis_date__month=i + 1,
            ).count()
            monthly_stats.append({'month': months_uz[i], 'count': count})

        male_diagnoses = diagnoses_qs.filter(patient__gender='erkak', patient__date_of_birth__lte=child_cutoff).count()
        female_diagnoses = diagnoses_qs.filter(patient__gender='ayol', patient__date_of_birth__lte=child_cutoff).count()

        monthly_gender_stats = []
        for i in range(12):
            dx_month = diagnoses_qs.filter(
                diagnosis_date__year=today.year,
                diagnosis_date__month=i + 1,
            )
            monthly_gender_stats.append({
                'month': months_uz[i],
                'male': dx_month.filter(patient__gender='erkak', patient__date_of_birth__lte=child_cutoff).count(),
                'female': dx_month.filter(patient__gender='ayol', patient__date_of_birth__lte=child_cutoff).count(),
                'child': dx_month.filter(patient__date_of_birth__gt=child_cutoff).count(),
            })

        status_stats = list(
            diagnoses_qs.values('status')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        severity_stats = list(
            diagnoses_qs.values('severity')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        status_labels = {
            'yangi': 'Yangi', 'davolanyapti': 'Davolanyapti',
            'yaxshilandi': 'Yaxshilandi', 'tuzaldi': 'Tuzaldi', 'surunkali': 'Surunkali',
        }
        severity_labels = {
            'engil': 'Engil', 'orta': "O'rta", 'ogir': "Og'ir", 'juda_ogir': "Juda og'ir",
        }

        return Response({
            'summary': {
                'total_patients': total_patients,
                'total_diagnoses': total_diagnoses,
                'total_doctors': doctors_count,
                'active_diagnoses': active_diagnoses,
                'male_patients': male_count,
                'female_patients': female_count,
                'child_patients': child_count,
            },
            'disease_stats': disease_stats,
            'weekday_stats': weekday_stats,
            'monthly_stats': monthly_stats,
            'monthly_gender_stats': monthly_gender_stats,
            'gender_diagnoses': {'male': male_diagnoses, 'female': female_diagnoses},
            'status_stats': [
                {'status': s['status'], 'label': status_labels.get(s['status'], s['status']), 'count': s['count']}
                for s in status_stats
            ],
            'severity_stats': [
                {'severity': s['severity'], 'label': severity_labels.get(s['severity'], s['severity']), 'count': s['count']}
                for s in severity_stats
            ],
        })
# Bu kodni backend/core/views.py ning OXIRIGA qo'shing



# views.py ning boshiga quyidagi importlarni ham qo'shing:
# from django.core.files.uploadedfile import InMemoryUploadedFile

CLASS_NAMES = [
    'Eritrosit',
    'Healthy blood cell',
    'Leykotsit',
    'Noodatiy hujayralar',
    'Trombosit',
]

NORMAL_RANGES = {
    'Eritrosit':           {'Erkaklar': '4.5–5.9×10¹²/L', 'Ayollar': '4.0–5.2×10¹²/L', 'Bolalar': '4.0–5.0×10¹²/L'},
    'Leykotsit':           {'Erkaklar': '4.0–9.0×10⁹/L',  'Ayollar': '4.0–9.0×10⁹/L',  'Bolalar': '5.0–14.0×10⁹/L'},
    'Trombosit':           {'Erkaklar': '150–400×10⁹/L',   'Ayollar': '150–400×10⁹/L',   'Bolalar': '150–450×10⁹/L'},
    'Healthy blood cell':  {'Erkaklar': 'Mavjud',           'Ayollar': 'Mavjud',            'Bolalar': 'Mavjud'},
    'Noodatiy hujayralar': {'Erkaklar': "Yo'q",             'Ayollar': "Yo'q",              'Bolalar': "Yo'q"},
}

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blood_cell_model.h5')

_model = None

def get_model():
    global _model
    if _model is None:
        try:
            from tensorflow.keras.models import load_model
            _model = load_model(MODEL_PATH)
        except Exception as e:
            raise RuntimeError(f"Model yuklanmadi: {e}")
    return _model


def analyze_single_image(image_file):
    """Bitta rasmni tahlil qiladi, natija dict qaytaradi."""
    img = Image.open(image_file).convert('RGB')
    img_resized = img.resize((224, 224))
    arr = np.array(img_resized, dtype=np.float32)
    arr = efficientnet_preprocess(arr)
    arr = np.expand_dims(arr, axis=0)

    model = get_model()
    preds = model.predict(arr, verbose=0)[0]

    results = []
    for i, name in enumerate(CLASS_NAMES):
        pct = float(preds[i]) * 100
        results.append({
            'name': name,
            'percent': round(pct, 1),
            'normal_range': NORMAL_RANGES.get(name, {}),
        })

    top_idx = int(np.argmax(preds))
    top = CLASS_NAMES[top_idx]
    top_pct = round(float(preds[top_idx]) * 100, 1)

    return {
        'results': results,
        'top_class': top,
        'top_percent': top_pct,
        'warning': top == 'Noodatiy hujayralar',
        'method': 'classification',
        'model': 'EfficientNetB0',
    }


class AnalyzeImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'Rasm yuklanmadi'}, status=400)
        try:
            return Response(analyze_single_image(image_file))
        except RuntimeError as e:
            return Response({'error': str(e)}, status=503)
        except Exception as e:
            return Response({'error': f'Tahlil xatosi: {str(e)}'}, status=500)


class AnalyzeBatchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        import random, base64
        images = request.FILES.getlist('images')
        if not images:
            return Response({'error': 'Rasmlar yuklanmadi'}, status=400)
        if len(images) > 500:
            return Response({'error': "Maksimal 500 ta rasm"}, status=400)

        try:
            all_results = []
            for img_file in images:
                res = analyze_single_image(img_file)
                all_results.append({
                    'filename': img_file.name,
                    'top_class': res['top_class'],
                    'top_percent': res['top_percent'],
                    'warning': res['warning'],
                    'results': res['results'],
                    'method': res['method'],
                    'model': res['model'],
                })

            # 2 ta random rasm tanlash va base64 sifatida qaytarish
            sample_count = min(2, len(images))
            sample_indices = random.sample(range(len(images)), sample_count)
            samples = []
            for idx in sample_indices:
                img_file = images[idx]
                img_file.seek(0)
                img_bytes = img_file.read()
                b64 = base64.b64encode(img_bytes).decode('utf-8')
                mime = img_file.content_type or 'image/jpeg'
                samples.append({
                    'filename': images[idx].name,
                    'image_b64': f"data:{mime};base64,{b64}",
                    'analysis': all_results[idx],
                })

            # Umumiy statistika
            class_counts = {}
            for r in all_results:
                c = r['top_class']
                class_counts[c] = class_counts.get(c, 0) + 1
            warning_count = sum(1 for r in all_results if r['warning'])

            return Response({
                'total': len(images),
                'all_results': all_results,
                'samples': samples,
                'summary': {
                    'class_counts': class_counts,
                    'warning_count': warning_count,
                },
                'method': 'classification',
                'model': 'EfficientNetB0',
            })
        except RuntimeError as e:
            return Response({'error': str(e)}, status=503)
        except Exception as e:
            return Response({'error': f'Tahlil xatosi: {str(e)}'}, status=500)


class AnalyzeImageCVView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'Rasm yuklanmadi'}, status=400)
        try:
            import cv2
            import base64

            img_bytes = image_file.read()
            nparr = np.frombuffer(img_bytes, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                return Response({'error': "Rasm o'qilmadi"}, status=400)

            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (7, 7), 0)
            thresh = cv2.adaptiveThreshold(
                blur, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                11, 2
            )
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            output = image.copy()
            counts = {'Trombotsit': 0, 'Leykotsit': 0, 'Healthy': 0, 'Noodatiy': 0}

            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area < 50 or area > 5000:
                    continue
                (x, y), radius = cv2.minEnclosingCircle(cnt)
                if radius < 5 or radius > 80:
                    continue

                cx, cy, r_int = int(x), int(y), int(radius)
                px = img_rgb[cy, cx]
                r_val, g_val, b_val = int(px[0]), int(px[1]), int(px[2])

                if area < 150:
                    label, color_bgr = 'Trombotsit', (0, 255, 255)
                elif b_val > r_val and b_val > g_val:
                    label, color_bgr = 'Leykotsit', (255, 0, 0)
                else:
                    arc = cv2.arcLength(cnt, True)
                    circ = 4 * np.pi * area / (arc ** 2 + 1e-5)
                    if circ > 0.75:
                        label, color_bgr = 'Healthy', (0, 255, 0)
                    else:
                        label, color_bgr = 'Noodatiy', (0, 0, 255)

                counts[label] += 1
                cv2.circle(output, (cx, cy), r_int, color_bgr, 2)
                cv2.putText(output, label, (cx - 20, cy - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.4, color_bgr, 1)

            output_pil = Image.fromarray(cv2.cvtColor(output, cv2.COLOR_BGR2RGB))
            buf = io.BytesIO()
            output_pil.save(buf, format='PNG')
            buf.seek(0)
            b64 = base64.b64encode(buf.read()).decode('utf-8')

            return Response({
                'processed_image': f'data:image/png;base64,{b64}',
                'counts': counts,
            })
        except Exception as e:
            return Response({'error': f'CV tahlil xatosi: {str(e)}'}, status=500)