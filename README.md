# Tibbiy Boshqaruv Tizimi

Django backend + React frontend bilan yozilgan tibbiy boshqaruv platformasi.

## Rang palitrassi
- **Asosiy**: #22819A (Ko'k-moviy)
- **Yordam**: #90C2E7 (Ochiq ko'k)
- **Fon**: Oq (#FFFFFF, #F8FAFC)
- Shaffof glassmorphism dizayn

---

## Texnologiyalar
- **Backend**: Django 5 + Django REST Framework
- **Frontend**: React 18 + Vite + Recharts (grafiklar)
- **Ma'lumotlar bazasi**: SQLite (mahalliy ishlatish uchun)

---

## O'rnatish va ishga tushirish

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000
```

**Superuser yaratishda:** istalgan username va parol kiriting.
Bu foydalanuvchi admin bo'ladi.

### 2. Frontend (yangi terminal oynasida)

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend API: http://localhost:8000/api/

---

## Rollar va imkoniyatlar

### Admin
- Barcha doktorlarni ko'rish, qo'shish, o'chirish
- Barcha bemorlarni ko'rish (faqat ko'rish)
- Barcha tashxislarni ko'rish (faqat ko'rish)
- Statistika: **barcha doktorlar ma'lumotlari** asosida

### Doktor
- Faqat o'z bemorlarini qo'shish, ko'rish, tahrirlash, o'chirish
- Faqat o'z tashxislarini qo'shish, tahrirlash, o'chirish
- Statistika: **faqat o'z ma'lumotlari** asosida

---

## Sahifalar

| Sahifa | Admin | Doktor |
|--------|-------|--------|
| Bosh sahifa (Dashboard) | Ko'radi | Ko'radi |
| Doktorlar | Boshqaradi | Ko'rmaydi |
| Bemorlar | Ko'radi | Boshqaradi |
| Tashxislar | Ko'radi | Boshqaradi |
| Statistika | Hammaning statistikasi | O'zinikini |

---

## API Endpointlar

```
POST   /api/auth/login/      - Kirish
POST   /api/auth/logout/     - Chiqish
GET    /api/auth/me/         - Hozirgi foydalanuvchi

GET    /api/doctors/         - Doktorlar ro'yxati (Admin)
POST   /api/doctors/         - Doktor qo'shish (Admin)
DELETE /api/doctors/{id}/    - Doktorni o'chirish (Admin)

GET    /api/patients/        - Bemorlar ro'yxati
POST   /api/patients/        - Bemor qo'shish (Doktor)
PATCH  /api/patients/{id}/   - Bemorni tahrirlash (Doktor)
DELETE /api/patients/{id}/   - Bemorni o'chirish (Doktor)

GET    /api/diagnoses/       - Tashxislar ro'yxati
POST   /api/diagnoses/       - Tashxis qo'shish (Doktor)
PATCH  /api/diagnoses/{id}/  - Tashxisni tahrirlash (Doktor)
DELETE /api/diagnoses/{id}/  - Tashxisni o'chirish (Doktor)

GET    /api/statistics/      - Statistika
```

---

## Dizayn

- Oq va och kulrang fon
- Ko'k-moviy (teal) asosiy rang (#22819A)
- Shaffof kartalar va modallar
- Recharts bilan interaktiv grafiklar
- Glassmorphism elementlari
- Google Fonts (Inter)
