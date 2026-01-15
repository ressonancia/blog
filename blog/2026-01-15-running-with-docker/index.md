---
slug: running-ressonance-with-docker
title: Running Ressonance with docker
authors: [vtrgomes]
tags: [docker, open source, build in public]
date: 2026-01-15
---

This article walks developers through running Ressonance self hosted using Docker, from local development to production-ready setups. It explains the architecture, exposed ports, and data persistence while highlighting why Ressonance offers a unique, open, and unopinionated approach to real-time infrastructure. Whether you want full control or a smooth path to the cloud, the post shows how to get started quickly and confidently — with a free tier available to explore real-time at your own pace.

<!-- truncate -->


# Running ressonance self hosted

## Introduction

Real-time applications are no longer a “nice to have”. From dashboards and notifications to collaborative tools and live commerce, developers increasingly rely on WebSockets to deliver instant experiences. Yet, most real-time platforms hide infrastructure behind opaque abstractions or lock you into costly plans as you scale.

This post exists for a different reason.

I’m writing this to show **how to run Ressonance self hosted**, locally or on your own infrastructure, while keeping full control of your stack. Ressonance was built with an *uncopyable* philosophy: open source, transparent trade-offs, and zero friction between local development, self-hosting, and cloud usage. The same WebSocket engine powers all of them.

If you’re a developer or DevOps engineer who wants clarity, ownership, and an easy path to production, this guide is for you.

---

## Why run Ressonance self-hosted?

Running Ressonance in a self-hosted setup is ideal when you want:

- Full control over infrastructure and networking  
- Local development parity with production  
- No vendor lock-in while building real-time features  
- A drop-in alternative to services like Pusher  
- The freedom to migrate to cloud later without rewrites  

According to industry reports, **over 70% of modern SaaS applications now rely on real-time communication** for at least one core feature. Ressonance is designed to meet that demand without forcing you into a black box.

---

## Prerequisites

Before starting, make sure you have:

- Docker installed  
- Docker Compose (recommended for persistence and restarts)  
- Basic familiarity with containers and ports  

That’s it. No Kubernetes, no message brokers, no hidden dependencies.

---

## Running Ressonance self-hosted with Docker

The fastest way to get started is by running Ressonance as Docker containers.

### Option 1: Quick start with `docker run`

This option is great for testing or quick local exploration.

```bash
docker pull ressonancia/ressonance
```

```bash
docker run -it --rm \
  -p 80:80 \
  -p 8000:8000 \
  -p 8080:8080 \
  ressonancia/ressonance
```

Once running, you’ll have a full Ressonance environment available locally.

---

### Option 2: Recommended setup with Docker Compose

For ongoing development or self-hosting in staging or production, Docker Compose is the better choice.

Create a `docker-compose.yml` file:

```yaml
services:
  ressonance:
    image: ressonancia/ressonance
    restart: always
    ports:
      - "80:80"
      - "8000:8000"
      - "8080:8080"
```

Then start the service:

```bash
docker compose up -d
```

This gives you a stable, restart-safe setup that behaves similarly to the Ressonance Cloud runtime.

---

## Understanding exposed ports

Ressonance exposes three ports, each with a clear responsibility:

- **80** → Web dashboard (UI)  
- **8000** → Dashboard API  
- **8080** → WebSocket API (used by your application)  

For most applications, the WebSocket endpoint (`http://localhost:8080`) is the only one your backend or frontend needs to connect to.

---

## Persisting data (important for real usage)

By default, containers are ephemeral. If you restart or recreate them, you’ll lose configuration unless you persist data.

Ressonance uses a SQLite database internally, which can be mounted as a volume.

Create a local database file:

```bash
touch ./database.sqlite
```

Update your `docker-compose.yml`:

```yaml
services:
  ressonance:
    image: ressonancia/ressonance
    restart: always
    ports:
      - "80:80"
      - "8000:8000"
      - "8080:8080"
    volumes:
      - ./database.sqlite:/var/www/app/database/database.sqlite
```

This ensures your apps, keys, and settings survive container restarts (a critical detail for self-hosted setups).

---

## Self-hosted vs Ressonance Cloud

Self-hosting is perfect when you want control, learning, or on-prem deployments.

Ressonance Cloud is ideal when you want:

- Zero infrastructure maintenance  
- Automatic scaling  
- Managed security and updates  

The important part: **both run the same core engine**.

You can start self-hosted today and move to the cloud later without changing your WebSocket code. And if you’re just getting started, Ressonance offers a **free tier** so you can explore real-time features without commitment.

---

## Conclusion

Running ressonance self hosted is not about choosing complexity, it’s about choosing freedom.

With Docker, clear architecture, and a production-grade WebSocket engine, Ressonance lets developers build real-time systems with confidence, whether locally, self-hosted, or in the cloud. No rewrites. No lock-in. Just real-time, done right.

Ready to build real-time features without friction?

[Create your free Ressonance account today](https://ressonance.com), explore the free tier, and decide when, or if, you want to move to the cloud.

---

