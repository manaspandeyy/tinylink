# TinyLink

A robust, minimal URL shortener API and Dashboard built with Node.js, Express, and PostgreSQL.

[View Live Demo] (https://tinylink-er0n.onrender.com/) 
---

## Project Overview

This project was built as a take-home assignment to demonstrate backend engineering skills, specifically focusing on:
* **Data Integrity:** Handling concurrent click tracking using Database Transactions (FOR UPDATE).
* **Strict API Compliance:** Following specific route conventions and HTTP status codes (e.g., 409 for conflicts).
* **Automated Testing Readiness:** Implementing /healthz and standardized JSON error responses.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (Hosted on Neon)
* **Deployment:** Render
* **Frontend:** Vanilla HTML/CSS (Served statically)

---

## Key Features

1.  **Create Short Links:** Auto-generate 6-char codes or provide custom aliases (e.g., /my-link).
2.  **Smart Redirects:** Uses HTTP 302 redirects to ensure accurate click tracking (preventing browser caching).
3.  **Concurrency Handling:** Uses SQL transactions to ensure click counts are atomic and accurate, even under load.
4.  **Stats Dashboard:** Public stats page at /code/:code to view analytics without redirecting.
5.  **Validation:** Strong Regex validation for codes and URL parsing.

---

## Getting Started (Local)

Follow these steps to run the project on your machine.

### 1. Clone the repository
```bash
git clone [https://github.com/](https://github.com/)[YOUR_USERNAME]/tinylink.git
cd tinylink

