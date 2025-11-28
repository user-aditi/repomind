# RepoMind 🧠

RepoMind is an AI-powered code understanding platform that helps developers navigate complex codebases, analyze commit history, and transcribe engineering meetings. It leverages local LLMs (Ollama), Vector Search (ChromaDB), and RAG (Retrieval-Augmented Generation) to provide context-aware answers.

![RepoMind Dashboard](https://via.placeholder.com/800x400?text=RepoMind+Dashboard+Preview)

## 🚀 Features

* **AI Chat with Codebase:** Ask questions about your project structure, logic, and dependencies using RAG.
* **Repository Indexing:** Clone and index GitHub repositories locally for semantic search.
* **Meeting Assistant:** Upload meeting recordings (.wav, .mp3) to generate transcripts and AI summaries using OpenAI Whisper and LLMs.
* **Commit Analysis:** Track and analyze git commit history with AI insights.
* **Dashboard Analytics:** Visualize project statistics, file counts, and activity trends.
* **Local Privacy:** Powered by local instances of Ollama and ChromaDB—your code stays on your machine.

## 🛠️ Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Language:** TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Vector DB:** ChromaDB
* **AI/LLM:** LangChain, Ollama (Llama 3.2), Xenova Transformers (Whisper)
* **Queue System:** BullMQ & Redis
* **Styling:** Tailwind CSS & Shadcn/UI
* **Authentication:** NextAuth.js (v5)

## ⚙️ Prerequisites

* Docker & Docker Compose
* Node.js 18+
* Git

## 📦 Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/user-aditi/repomind.git](https://github.com/user-aditi/repomind.git)
    cd repomind
    ```

2.  **Setup Environment Variables**
    Copy the example env file:
    ```bash
    cp .env.example .env
    ```
    Update `.env` with your secure keys (generate a random `AUTH_SECRET`).

3.  **Start Infrastructure (Docker)**
    Start PostgreSQL, Redis, ChromaDB, and Ollama:
    ```bash
    docker-compose up -d
    ```

4.  **Install Dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

5.  **Initialize Database**
    ```bash
    npx prisma generate
    npx prisma db push
    ```

6.  **Initialize Vector Store**
    ```bash
    npm run vector:init
    ```

7.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🐳 Docker Services

The project includes a `docker-compose.yml` that orchestrates:
* `postgres`: Main relational database.
* `chromadb`: Vector store for embeddings.
* `ollama`: Local LLM inference server.
* `redis`: Queue management for transcription jobs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
