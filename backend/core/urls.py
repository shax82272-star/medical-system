# core/urls.py ga shu qatorni qo'shing:
# 1) Importga qo'shing:
#    from .views import AnalyzeImageView
#
# 2) urlpatterns ga qo'shing:
#    path('analyze/', AnalyzeImageView.as_view(), name='analyze'),

# To'liq urls.py shunday bo'ladi:

from django.urls import path
from .views import (
    LoginView, LogoutView, MeView,
    DoctorListCreateView, DoctorDetailView,
    PatientListCreateView, PatientDetailView,
    DiagnosisListCreateView, DiagnosisDetailView,
    StatisticsView,
    AnalyzeImageView,
    AnalyzeBatchView,
    AnalyzeImageCVView,
)

urlpatterns = [
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/me/', MeView.as_view(), name='me'),

    path('doctors/', DoctorListCreateView.as_view(), name='doctor-list'),
    path('doctors/<int:pk>/', DoctorDetailView.as_view(), name='doctor-detail'),

    path('patients/', PatientListCreateView.as_view(), name='patient-list'),
    path('patients/<int:pk>/', PatientDetailView.as_view(), name='patient-detail'),

    path('diagnoses/', DiagnosisListCreateView.as_view(), name='diagnosis-list'),
    path('diagnoses/<int:pk>/', DiagnosisDetailView.as_view(), name='diagnosis-detail'),

    path('statistics/', StatisticsView.as_view(), name='statistics'),
    path('analyze/', AnalyzeImageView.as_view(), name='analyze'),
    path('analyze/batch/', AnalyzeBatchView.as_view(), name='analyze-batch'),
    path('analyze/cv/', AnalyzeImageCVView.as_view(), name='analyze-cv'),
]