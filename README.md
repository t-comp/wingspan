# Wingspan

## Team Members
**Backend:** Taylor Bauer & Abby Van Den Brink

**Frontend:** Siri Gandhi & Lexi Pachonphai

**Client:** Nathan Brockman, Reiman Gardens at Iowa State University

**Course:** COMS 4020 Senior Design - Spring 2026

## Project Overview
Wingspan is a centralized butterfly and insect image library and REST API built for Reiman Gardens at Iowa State University. Nathan at Reiman Gardens uploads and manages photos through an admin dashboard. Student teams receive API keys and pull images and metadata into their own applications via the Wingspan API.


## Tech Stack
- Backend: Java Spring Boot 3.2.1, Maven, package `fs3.wingspan`
- Frontend: Vite, Handlebars, TypeScript, Bootstrap 5
- Database: PostgreSQL on DigitalOcean
- File Storage: DigitalOcean Spaces (S3 compatible)
- Server: DigitalOcean Droplet

## Running Locally

**Prerequisites:** Java 17, Maven, Node.js and npm, local PostgreSQL instance

**Backend:** Create a local `application.properties` file at `src/main/resources/application.properties` with your local database credentials and DigitalOcean Spaces credentials from Nathan. Open `WingspanApplication` in IntelliJ and run.

**Frontend:** cd into the frontend directory, run `npm install` then `npm run dev`.

## Documentation
Please refer to our [website](https://seniord.cs.iastate.edu/2026-March-16/) !

If you choose the tab "Project Artifacts" -> "Final Project Report" this is our most comprehensive report of our application and development process. There are additional tabs to checkout under "Project Artifacts" if you please. Additionally on our website under "Progress Reports" you can see each of our presentations for our Demos and Lightning Talks.

The following two items are coming soon and will be in a docs folder within this project.

- Developer Wiki (coming soon...)
- API Reference (coming soon...)
