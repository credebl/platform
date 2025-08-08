# CREDEBL SSI Platform

Welcome to **CREDEBL** — an open-source Decentralized Identity & Verifiable Credentials platform, and part of the [Linux Foundation Decentralized Trust Project](https://lftprojects.org/).

CREDEBL enables scalable, privacy-preserving digital identity systems. It powers real-world solutions like the **Decentralized National Digital ID for Bhutan and Papua New Guinea**, and **Sovio.id by AYANWORKS**.

---

## ⚙️ Minimal Setup

This section provides the absolute minimum steps to get the CREDEBL API Gateway running for development. For comprehensive setup instructions, API reference, and architectural details, please refer to our official documentation.

### Prerequisites

* **Node.js**: We recommend using Node.js version 18 LTS.
* **npm**: Node Package Manager (comes with Node.js).
* **Git**: For cloning the repository.
* **(One-time) Nest CLI**: If you don't have it installed globally, run:
    ```bash
    npm i -g @nestjs/cli
    ```

### Steps to Run

1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/credebl/platform.git](https://github.com/credebl/platform.git)
    cd platform
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start the API Gateway (Development Mode)**
    This command will start the API Gateway in watch mode, which is suitable for development.
    ```bash
    npm run start:gateway:dev
    ```

---

## 📚 Documentation

For a full setup guide, detailed API reference, advanced configurations, and architectural documentation, please visit:
➡️ [https://docs.credebl.id](https://docs.credebl.id)

---

## 🤝 Contributing

We welcome contributions to CREDEBL! Please read our [Contribution Guide](CONTRIBUTING.md) before submitting a pull request.

**Note**: All commits must be signed (Developer Certificate of Origin - DCO required).

---

## 📄 License

This project is licensed under the Apache License 2.0.