.PHONY: dev-backend dev-frontend install setup

install:
	cd backend && pip install -r requirements.txt
	cd frontend && npm install

setup:
	cp -n .env.example .env || true

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8004

dev-frontend:
	cd frontend && npm run dev

dev:
	@echo "Run in separate terminals:"
	@echo "  make dev-backend"
	@echo "  make dev-frontend"
