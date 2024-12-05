docker image build --tag keno-soccer/local:latest -f Dockerfile .
docker run -p 8089:8089 -d keno-soccer/local:latest
