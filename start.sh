docker stop zevairouter
docker rm zevairouter
docker build -t zevairouter .
docker run -d --name zevairouter -p 20128:20128 --env-file .env -v zevairouter-data:/app/data zevairouter
