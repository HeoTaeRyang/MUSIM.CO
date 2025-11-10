# 베이스 이미지
FROM python:3.10-slim

# OpenCV 실행에 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /app

# 전체 파일 복사
COPY . /app

# 의존성 설치
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# 실행 명령
CMD ["python", "backend/app.py"]