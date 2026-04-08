# AltResume | AI Career Copilot

AltResume is a production-grade AI-powered SaaS application designed to help job seekers optimize their resumes, bypass Applicant Tracking Systems (ATS), and land more interviews. By analyzing job descriptions and comparing them against user resumes, AltResume provides actionable insights, missing keywords, and automatically rewrites resume bullet points to perfectly align with target roles.

---

## 🚀 Features

- **Google OAuth Authentication**: Secure, seamless login using Google accounts with JWT session management.
- **Smart Resume Parsing**: Extracts structured data from PDF and DOCX files. Handles edge cases like scanned PDFs gracefully.
- **Job Description Analysis**: Uses AI to extract required skills, preferred qualifications, and crucial ATS keywords from any job description.
- **AI-Powered Optimization**: Compares your resume against the JD, generates an ATS match score, identifies missing keywords, and rewrites bullet points for maximum impact without hallucinating fake experience.
- **Tiered Token System**: Built-in pricing tier logic (Free, Pro, Premium, Elite) with token limits and automatic usage deduction.
- **High-Quality PDF Exports**: Generates clean, professional, ATS-friendly PDF exports using custom templates and dynamic filenames.
- **Premium UI/UX**: Built with a sleek, Stripe-inspired Next.js frontend, featuring smooth micro-interactions, Inter typography, and a refined light-mode aesthetic.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Typography**: Inter (Google Fonts)

### Backend
- **Framework**: [Django](https://www.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/) (DRF)
- **Database**: [MongoDB](https://www.mongodb.com/) (accessed via Djongo)
- **Asynchronous Task Queue**: [Celery](https://docs.celeryq.dev/) backed by [Redis](https://redis.io/)
- **AI Integration**: Dual Provider System integrating [OpenAI API](https://openai.com/) (GPT-4o-mini structured JSON outputs) and Hugging Face Inference (`Qwen/Qwen2.5-7B-Instruct`) for resilient JSON schema repair.
- **PDF Generation**: WeasyPrint / HTML-to-PDF

---

## ⚙️ Local Development Setup

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- MongoDB (Running locally or via Atlas)
- Redis server (Running locally on `redis://localhost:6379`)

### 1. Clone the repository
```bash
git clone https://github.com/sayandeepdas02/altresume.git
cd altresume
```

### 2. Backend Setup
Navigate to the `backend` directory, create a virtual environment, and install dependencies:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
# Django Settings
SECRET_KEY=your_django_secret_key
DEBUG=True

# MongoDB Settings
MONGO_URI=mongodb://localhost:27017/altresume
MONGO_DB_NAME=altresume

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Celery / Redis
CELERY_BROKER_URL=redis://localhost:6379/0
```

Run database migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

Start the Django development server:
```bash
python manage.py runserver 8000
```

Start the Celery worker (in a separate terminal inside `backend/`):
```bash
celery -A core worker --loglevel=info
```

### 3. Frontend Setup
Navigate to the `frontend` directory and install dependencies:
```bash
cd ../frontend
npm install
```

Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

Start the Next.js development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

---

## 🏗 System Architecture Overview

The system is decoupled into two primary domains:
1. **Next.js Frontend**: Handles the UI flow (Dashboard -> Upload -> Paste JD -> Loading/Optimization -> Results -> Export). Custom middlewares guard the routes and provide gated access based on the user's JWT.
2. **Django Backend**: Exposes RESTful endpoints for the frontend. Includes modular apps:
   - `core`: Base settings, custom DRF global exception handling, and throttling.
   - `authentication` & `users`: Google OAuth flows, custom JWT mapping to MongoDB ObjectIds, and tier/token definition.
   - `resumes`: Safe document ingestion (file validation) and parsing.
   - `optimization`: Interacts with OpenAI using strict, fail-safe JSON schema properties. Offloads heavy processing (~10s) to Redis/Celery to guarantee UI responsiveness.
   - `export`: Injects AI-optimized content into dynamic HTML templates and outputs binary PDFs.

---

## 🛡 Security & Reliability
- **Strict Output Formatting**: AI optimizations are constrained by rigid JSON schemas (`gpt-4o-mini` with `json_schema` type) to eliminate hallucinated responsibilities.
- **Decoupled Architecture**: Failed Celery operations intelligently refund the user's credits and bubble explicit errors back to the frontend dashboard.
- **Fail-Fast Validations**: The server terminates oversized files (`> 5MB`), scanned unreadable PDFs, and excessive Job Descriptions before hitting computational limits.

---

## 🛑 Current Known Issues & Ongoing Fixes

Please reference `projectupdate.md` for a comprehensive system audit. The following critical issues are currently being addressed:

- **Missing `requirements.txt`**: The backend dependency file is currently missing from the repository, requiring manual environment setup.
- **Configuration Drift**: The AI repair infrastructure relies on `HUGGINGFACE_API_KEY` which is undocumented in `.env` setup instructions.
- **Silent Failures**: Certain Celery fallback tasks handle errors silently. Detailed logging is being introduced.

---

## 📄 License
This project is proprietary.
