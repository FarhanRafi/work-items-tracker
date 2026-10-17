# Work Items Tracker

A practical, production-ready Work Items Tracker application designed as a learning vehicle for professional .NET development, modern Angular architecture, CI/CD, containerization with Docker, and Kubernetes deployment.

---

## 1. Project Overview & Architecture

The system is built as a modular monolithic application adhering to clean separation of concerns without unnecessary microservice complexity:

```
work-items-tracker/
├── src/
│   ├── WorkItemsTracker.Core/           # Domain entities, enums, value objects, business contracts
│   ├── WorkItemsTracker.Infrastructure/ # EF Core DbContext, migrations, repositories, auth hashing
│   └── WorkItemsTracker.Api/            # ASP.NET Core Web API, controllers, DTOs, JWT middleware
├── tests/
│   └── WorkItemsTracker.Tests/          # xUnit tests (Domain, EF Core, API integration tests)
├── frontend/                            # Angular SPA (standalone components, reactive forms, signals)
├── .editorconfig                        # Unified coding styles
├── .gitignore                           # Git exclusions for .NET, Node, and IDEs
└── README.md
```

### Technology Stack

- **Backend**: ASP.NET Core Web API on .NET 10 (`net10.0`)
- **Database & ORM**: Microsoft SQL Server (LocalDB for local dev; containerized SQL Server for Docker/K8s) with Entity Framework Core 10
- **Authentication**: JWT Bearer Tokens with ASP.NET Core password hashing (`IPasswordHasher<T>`)
- **Frontend**: Angular 22 (Standalone components, TypeScript, modern CSS design tokens)
- **Automated Testing**: xUnit, FluentAssertions, Moq, `Microsoft.AspNetCore.Mvc.Testing`
- **Containerization & Orchestration** *(Phases 4–8)*: Docker, Docker Compose, GitHub Actions, Kubernetes

---

## 2. Multi-Stage Learning Roadmap

1. **Local Foundation & App Development** *(Current)*: Build a complete, functional backend and frontend working against local SQL Server LocalDB.
2. **Automated Testing & Code Quality**: Comprehensive unit, integration, and security/ownership tests.
3. **Containerization**: Package backend and frontend into multi-stage Dockerfiles and orchestrate locally via Docker Compose.
4. **CI/CD Pipeline**: GitHub Actions for automated build, test verification, and container registry publishing (GHCR).
5. **Production Deployment without Kubernetes**: Standard single-host / VM / container app deployment.
6. **Local Kubernetes**: Minikube/Kind manifests, deployments, services, secrets, and ingress.
7. **Production Kubernetes**: Helm charts, health probes, zero-downtime rolling updates.

---

## 3. Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/)
- [Node.js](https://nodejs.org/) (v22+ or v24 LTS) & npm
- Microsoft SQL Server LocalDB (`(localdb)\mssqllocaldb`) or SQL Server Express
- Optional (for later phases): Docker Desktop

---

## 4. Local Setup & Running

### Starting SQL Server LocalDB

```powershell
sqllocaldb start MSSQLLocalDB
```

### Running the Backend API

```powershell
cd src/WorkItemsTracker.Api
dotnet run
```

The API runs by default on `https://localhost:7001` and `http://localhost:5001`.
- OpenAPI / Swagger: `http://localhost:5001/openapi/v1.json`
- Health check: `http://localhost:5001/health`

### Running the Frontend

```powershell
cd frontend
npm install
npm start
```

Access the frontend in your browser at `http://localhost:4200`.

### Running Automated Tests

```powershell
# Run backend xUnit test suite
dotnet test

# Run frontend test suite
cd frontend
npm test
```

---

## 5. Database Migrations

To add or update EF Core migrations:

```powershell
dotnet ef migrations add <MigrationName> --project src/WorkItemsTracker.Infrastructure --startup-project src/WorkItemsTracker.Api
dotnet ef database update --project src/WorkItemsTracker.Infrastructure --startup-project src/WorkItemsTracker.Api
```

The application is configured to automatically apply pending migrations on startup during development.
