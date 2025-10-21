FROM python:3.10-slim

WORKDIR /app

# Copy only backend dependencies first
COPY ./backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy backend app code only
COPY ./backend/ /app/

# Start Gunicorn with Uvicorn worker
CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "main:app", "--bind", "0.0.0.0:8000"]
