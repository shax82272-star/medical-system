#!/bin/bash
echo "=== Tibbiy tizim backend o'rnatilmoqda ==="

pip install -r requirements.txt

echo "=== Migratsiyalar qilinmoqda ==="
python manage.py makemigrations
python manage.py migrate

echo ""
echo "=== Superuser yarating ==="
echo "Quyidagi buyruqni ishlating:"
echo "  python manage.py createsuperuser"
echo ""
echo "=== Serverni ishga tushiring ==="
echo "  python manage.py runserver 0.0.0.0:8000"
echo ""
echo "=== Frontend ni ham yoqing ==="
echo "  cd ../frontend && npm install && npm run dev"
