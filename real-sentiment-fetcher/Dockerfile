FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && python -m textblob.download_corpora
COPY fetcher.py .
CMD ["python", "fetcher.py"]
