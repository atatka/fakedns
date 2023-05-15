FROM node:18 as builder
WORKDIR /app
COPY package*.json ./
RUN npm config set loglevel error && npm install --production
COPY . .

FROM node:18-alpine
RUN apk add --no-cache netcat-openbsd
RUN addgroup -g 1001 -S app && adduser -u 1001 -S app -G app && addgroup -S -g 997 docker && addgroup app docker
USER app
WORKDIR /app
COPY --from=builder --chown=app:app /app .
EXPOSE 5353
CMD ["npm", "start"]
