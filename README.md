# Homeschool Planner

A weekly planning app for homeschooling families. Tracks daily subject completion, supports "Pick 1" curriculum choices, and captures learning narrations (text, voice, photo).

## Tech Stack

- **Framework**: Rails 8.1 with Hotwire (Turbo + Stimulus)
- **Database**: SQLite with Solid Queue/Cache/Cable
- **Styling**: Tailwind CSS 4
- **Ruby**: 3.4.4
- **Deployment**: Kamal 2 with Docker (GitHub Container Registry)
- **Server**: Thruster + Puma

## Getting Started

### Prerequisites

- Ruby 3.4.4 (see `.ruby-version`)
- SQLite 3

### Setup

```bash
bundle install
bin/rails db:prepare
```

### Development

```bash
bin/dev  # Starts Rails server + Tailwind CSS watcher
```

The app will be available at `http://localhost:3000`.

## Testing & CI

```bash
bin/rails test       # Run test suite
bin/rubocop          # Run linter
bin/ci               # Run full CI suite (tests + linter + security)
```

CI runs automatically on pushes to `main` and on pull requests via GitHub Actions. It includes:

- Rubocop style checks
- Bundler audit (gem vulnerabilities)
- Importmap audit (JavaScript dependencies)
- Brakeman security analysis
- Rails tests
- Seed data replication test

## Deployment

The app is deployed with [Kamal 2](https://kamal-deploy.org) as Docker containers to a VPS, using GitHub Container Registry (`ghcr.io`).

### Environments

| Environment | URL                    | Config                        |
| ----------- | ---------------------- | ----------------------------- |
| Production  | `hs.zavi.family`       | `config/deploy.yml`           |
| Staging     | `test.hs.zavi.family`  | `config/deploy.staging.yml`   |

Both environments run on the same VPS with separate data volumes and service names.

### Deploy Commands

```bash
# Production
kamal deploy

# Staging
kamal deploy -d staging
```

### Useful Kamal Commands

These work for both environments (add `-d staging` for staging):

```bash
kamal console           # Rails console
kamal shell             # Bash shell on the server
kamal logs              # Tail application logs
kamal dbc               # Database console
```

### Environment Variables

| Variable                 | Description                          |
| ------------------------ | ------------------------------------ |
| `KAMAL_REGISTRY_PASSWORD`| GitHub Container Registry auth token |
| `RAILS_MASTER_KEY`       | Rails credentials decryption key     |
