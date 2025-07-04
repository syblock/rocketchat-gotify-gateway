FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y curl

COPY package.json bun.lockb ./

RUN bun install

COPY . .

CMD bun run start