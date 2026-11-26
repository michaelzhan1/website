---
title: Mock Log System
link: https://github.com/michaelzhan1/mock-log-system
---

I started this project mainly as a way to get more familiar with Kafka, but it
also ended up being an exploration into HTTP and database best practices. The
project is a simplified version of a log-tracking system like Humio. Logs are
produced to a Kafka topic, distributed across multiple consumers, and are stored
in TimescaleDB. A frontend then provides a simple interface for querying logs
and viewing summary statistics, through a raw C++ HTTP server.
