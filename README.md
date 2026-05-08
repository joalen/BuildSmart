# BuildSmart
An AI-powered home improvement planning tool that turns a plain-language project description into a fully itemized, shoppable Home Depot cart. This project is complete with real-time pricing, live inventory checks, and step-by-step guidance.

## What it does
You describe a project in plain English ("I want to tile a 12x10 bathroom floor"), and BuildSmart:
- Generates a structured, step-by-step project plan using OpenAI
- Maps every material to a real Home Depot SKU with live pricing
- Checks real-time stock at your nearest store
- Surfaces attach-rate recommendations so you don't forget anything
- Produces an itemized cart you can export as a CSV

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | TypeScript, React, Vite, shadcn/ui |
| Backend | Python, FastAPI, Uvicorn |
| AI / NLP | OpenAI API |
| Product Data | Headless browser scraping (Home Depot) |
| Infrastructure | Docker, docker-compose |

## Getting Started
**Prerequisites**:
- Docker Desktop
- Node.js + npm
- A .env file with the required API keys (see below)

### Installation Steps
- macOS / Linux: `curl -fsSL https://raw.githubusercontent.com/joalen/buildsmart/master/install.sh | bash`
- Windows (PowerShell): `irm https://raw.githubusercontent.com/joalen/buildsmart/master/install.ps1 | iex`

### Running as Development Mode 
1. Place your .env file inside the backend/ folder
2. Start the dev server as `npm run dev`

^ This spins up the Vite frontend and the Docker-managed backend simultaneously. Wait for both Vite and Uvicorn to report ready before using the app.

### Project Structure
```sh
BuildSmart/
├── frontend/ # react and typescript UI
│   └── src/
│       ├── components/ # shadcn + custom UI components
│       ├── hooks/ # State and loading hooks
│       └── pages/ # Route-level page components
├── backend/
│   ├── projectplanner/ # OpenAI wrapper — NLP -> structured plan
│   └── homedepot/ # Headless browser -> live SKU/pricing data
├── Dockerfile
├── docker-compose.yml
└── install.sh / install.ps1
```

### Environment Variables
You'll want to create a secrets manager project from Infisical and then through that, you'll insert your OPENAI_API_KEY
```sh
INFISICAL_CLIENT_ID=
INFISICAL_CLIENT_SECRET=
```
^ for more info on how to get these. Refer here: https://infisical.com/docs/cli/commands/secrets

## Documentation
The full Software Engineering specification document (requirements, system architecture, wireframes, test cases, and deployment plan) is available under the docs folder and BuildSmart_SED.pdf

## Contributions from Alen Jo
**Architecture & Infrastructure:** 
- Designed the physical system architecture and led all technical setup decisions
- Built the entire frontend scaffolding and component structure from scratch
- Configured Docker containers and docker-compose for local development
- Set up CI/CD pipelines via GitHub Actions for automated testing
- Hosted the live demo via Cloudflare Tunnels for in-class presentation

**Core Features:** 
- Integrated the Home Depot GraphQL API endpoint for real-time product enrichment
- Built the OpenAI/ChatGPT pipeline that converts natural language input into structured project plans
- Implemented the BI export pipeline (SKU + quantity demand signals, no PII)
- Added shopping cart CSV export functionality

**SE Document:**
- Owned FR-1 through FR-10 (product catalog, NLP input, SKU mapping, inventory, BI export)
- Wrote NFR-1 through NFR-3 (attach-rate accuracy, API sync intervals, demand pipeline SLAs)
- Authored User Stories US-14 through US-19, Use Case Diagram 4, Sequence Diagram 3, Wireframes 4–6, and corresponding test cases

**Leadership**
- Conducted code reviews across all teammates to ensure end-to-end integration of our MVP

## Full Team
| Name | Role |
|---|---|
| Prajit Alexander | Implementation overview, NLP/AI requirements, AR, analytics |
| Estrella Avila | Project dashboard UI, customer experience features |
| Nathan Tennyson | Deployment plan, privacy/monitoring requirements, docs |

## Troubleshooting Help
**Changes not reflecting after save**: Stop the Docker container (Ctrl+C three times), then re-run npm run dev.
**Still not updating**: Clear the Docker cache: docker compose down --rmi all, then re-run npm run dev.
**Session boot failed**: Home Depot's internal API detected unusual activity. Restart the backend via Ctrl+C → npm run dev. This is intermittent and typically resolves on retry (or worst case, you'll need to wait a few minutes).