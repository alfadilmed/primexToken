# Primex Platform

Primex is a platform designed to simplify the creation, deployment, and interaction with smart contracts on EVM-compatible blockchains. It provides users with templates, a smart contract generator, and a visual editor to build simple decentralized applications (dApps).

## High-Level Architecture

The platform consists of three main components:

*   **Frontend (`src/`):** A React single-page application (SPA) that provides the user interface for interacting with the platform. Users can manage templates, generate contracts, deploy them, and use the visual editor here.
*   **Backend (`backend/`):** A Node.js/Express API server that handles business logic, user authentication, data persistence (MongoDB), and the compilation of Solidity smart contracts.
*   **Smart Contracts (`contracts/`):** A collection of Solidity templates (ERC20, NFT, Crowdfunding, Voting) that users can customize and deploy.

## Prerequisites

Before you begin, ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (v18.x or later recommended)
*   [npm](https://www.npmjs.com/) (v8.x or later, typically comes with Node.js) or [Yarn](https://yarnpkg.com/)
*   [MetaMask](https://metamask.io/) browser extension (or a similar Web3 wallet)

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <repository_url>
    cd primex-platform # Or your repository's root folder name
    ```

2.  **Install Frontend Dependencies:**
    The main `package.json` in the root is for the frontend.
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install
    # or
    # yarn install
    cd ..
    ```

## Running the Development Servers

1.  **Start the Backend Server:**
    ```bash
    cd backend
    npm run dev 
    ```
    The backend server will typically start on `http://localhost:5000` (or as configured in your `.env` file).

2.  **Start the Frontend Development Server:**
    In a new terminal, from the project root:
    ```bash
    npm start
    ```
    The frontend application will typically open in your browser at `http://localhost:3000`.

## Directory Structure Overview

*   `src/`: Contains the frontend React application code.
*   `public/`: Static assets for the frontend.
*   `backend/`: Contains the backend Node.js/Express API server code.
*   `contracts/`: Contains Solidity smart contract templates.
*   `CONTRIBUTING.md`: Guidelines for contributing to the project.

## Contributing

Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to this project.
