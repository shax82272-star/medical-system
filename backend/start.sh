#!/bin/bash
echo "==================================="
echo "  Tibbiy Tizim Backend"
echo "==================================="
echo ""
echo "1. Kutubxonalarni o'rnatish..."
pip install -r requirements.txt -q

echo "2. Migratsiyalar..."
python manage.py makemigrations --verbosity=0
python manage.py migrate --verbosity=0

echo ""
echo "==================================="
echo "Superuser yaratish:"
echo "  python manage.py createsuperuser"
echo ""
echo "Serverni ishga tushirish:"
echo "  python manage.py runserver 0.0.0.0:8000"
echo "==================================="
