FROM mcr.microsoft.com/playwright:v1.55.0
WORKDIR /app

COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
RUN apt-get update --fix-missing && apt-get install -y xvfb
RUN npx playwright install --with-deps

COPY ./playwright.config.ts .
COPY ./playwright.merge.config.ts .

ENV PLAYWRIGHT_HTML_HOST=0.0.0.0

CMD ["sh", "-c", "npx playwright test"]