# Primex Frontend

This directory (`src/`) contains the React single-page application (SPA) that serves as the user interface for the Primex platform.

## Technology Stack

*   **React:** JavaScript library for building user interfaces (v18.x).
*   **TypeScript:** Superset of JavaScript for static typing.
*   **React Router DOM:** For client-side routing and navigation (v6.x).
*   **TailwindCSS:** Utility-first CSS framework for styling.
*   **Ethers.js:** Library for interacting with Ethereum blockchains and Web3 wallets (v6.x).
*   **React Context API:** For global state management (e.g., authentication, Web3 connection).
*   **Axios:** (Likely used for HTTP requests to the backend API, based on backend dependencies; confirm if used directly or via a wrapper).
*   **@dnd-kit:** Libraries for enabling drag-and-drop functionality, used in the Visual Editor.

## Setup and Configuration

1.  **Navigate to the project root directory** (if not already there).
    The frontend's `package.json` is the one located at the root of this project.

2.  **Install Dependencies:**
    If not already done:
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Environment Variables:**
    The frontend application uses `react-scripts` (from Create React App), which supports environment variables through files like `.env`. Typically, variables should be prefixed with `REACT_APP_`.
    Example `.env` file at the project root:

    ```dotenv
    REACT_APP_BACKEND_API_URL=http://localhost:5000/api 
    # Replace with your actual backend API URL if different

    # Add other frontend-specific environment variables as needed
    # e.g., REACT_APP_DEFAULT_CHAIN_ID=80001 (Polygon Mumbai)
    ```

## Available Scripts

From the project root directory:

*   **`npm start`**: Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.
*   **`npm run build`**: Builds the app for production to the `build` folder. It correctly bundles React in production mode and optimizes the build for the best performance.
*   **`npm test`**: Launches the test runner in interactive watch mode. (Assumes Jest and React Testing Library are configured, which is default with Create React App).
*   **`npm run eject`**: Removes Create React App's managed configuration and scripts. **Note: this is a one-way operation. Once you eject, you can't go back!** Only do this if you need advanced customization not supported by CRA.

## Folder Structure (`src/`)

*   `components/`: Reusable UI components, often organized by feature.
    *   `auth/`: Authentication-related components (e.g., `ProtectedRoute.tsx`).
    *   `editor/`: Components for the Visual Editor (e.g., `Canvas.tsx`, `ComponentPalette.tsx`).
    *   `layout/`: Structural components like `Navbar.tsx` and `Layout.tsx`.
*   `config/`: Frontend configuration files.
    *   `editorConfig.ts`: Configuration for the Visual Editor's palette items.
    *   `solidityTemplates/`: Contains strings of Solidity template code, likely used by the Smart Contract Generator.
*   `contexts/`: React Context providers for global state management.
    *   `AuthContext.tsx`: Manages user authentication state.
    *   `Web3Context.tsx`: Manages Web3 provider, signer, account, and network information.
*   `hooks/`: (If any) Custom React hooks.
*   `pages/`: Top-level components representing different views/routes of the application (e.g., `Dashboard.tsx`, `Login.tsx`, `Deploy.tsx`, `Editor.tsx`).
*   `services/`: (If any) Modules for interacting with the backend API or other external services.
*   `types/`: TypeScript type definitions and interfaces.
    *   `editor.ts`: Types specific to the Visual Editor.
*   `App.tsx`: The main application component that sets up routing.
*   `index.tsx`: The entry point of the React application.
*   `index.css`: Global styles or TailwindCSS base/component imports.

## Styling

Styling is primarily handled using [TailwindCSS](https://tailwindcss.com/). Utility classes are used directly in the JSX components. Global styles and Tailwind configurations can be found in `index.css`, `tailwind.config.js`, and `postcss.config.js`.

## State Management

Global application state is managed using React's Context API.
*   `AuthContext` handles user authentication status and tokens.
*   `Web3Context` handles the Web3 provider, connection status, selected account, and network details.
Component-level state is managed using React Hooks (`useState`, `useEffect`, etc.).
