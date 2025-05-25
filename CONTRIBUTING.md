# Contributing to Primex Platform

Thank you for considering contributing to the Primex platform! We welcome contributions from the community to help us improve and expand the platform.

## Code of Conduct

While we don't have a formal Code of Conduct document yet, we expect all contributors to adhere to respectful and constructive communication. Please be kind and considerate when interacting with others in issues, pull requests, and discussions. Harassment or exclusionary behavior will not be tolerated.

## How to Report Bugs

If you encounter a bug, please help us by submitting an issue to our GitHub repository (if applicable, otherwise specify the bug reporting channel).

When reporting a bug, please include:

*   **A clear and descriptive title.**
*   **Steps to reproduce the bug:** Provide as much detail as possible, including any specific inputs or configurations.
*   **Expected behavior:** What you expected to happen.
*   **Actual behavior:** What actually happened, including any error messages.
*   **Environment details (if relevant):** Your browser, operating system, Node.js version, etc.

## How to Propose Features or Enhancements

If you have an idea for a new feature or an enhancement to an existing one, please:

1.  **Check existing issues:** See if there's already an issue or discussion about your idea.
2.  **Open a new issue:** If not, open a new issue to discuss your proposal. Clearly describe the feature, its benefits, and potential implementation ideas. This allows for discussion before significant development work begins.

## Development Workflow

We generally follow a standard Git workflow:

1.  **Fork the repository** (if you are an external contributor).
2.  **Create a feature branch:** Branch off from the `main` or `develop` branch (clarify which is the primary development branch).
    ```bash
    git checkout -b feature/your-feature-name main 
    # or
    # git checkout -b fix/your-bug-fix main
    ```
3.  **Make your changes:** Implement your feature or bug fix.
4.  **Commit your changes:**
    *   Use clear and descriptive commit messages. We encourage adhering to [Conventional Commits](https://www.conventionalcommits.org/) if possible (e.g., `feat: Add X feature`, `fix: Resolve Y bug`).
    *   Ensure your commits are atomic and represent logical units of work.
5.  **Code Style & Linting:**
    *   (Once configured) Ensure your code adheres to the project's linting rules (e.g., ESLint). Run the linter locally before committing.
    *   (Once configured) Format your code using the project's code formatter (e.g., Prettier).
6.  **Testing:**
    *   **Write tests!** All new features should include appropriate unit and/or integration tests. Bug fixes should ideally include a test that reproduces the bug and verifies the fix.
    *   Ensure all tests pass before submitting a pull request: `npm test` (for frontend) and `cd backend && npm test` (for backend).
7.  **Push your branch:**
    ```bash
    git push origin feature/your-feature-name
    ```
8.  **Open a Pull Request (PR):**
    *   Target the `main` or `develop` branch (clarify which).
    *   Provide a clear title and description for your PR, summarizing the changes and linking to any relevant issues.
    *   Be prepared to discuss your changes and address any feedback from reviewers.

## Pull Request Process

1.  Once a PR is opened, project maintainers will review the changes.
2.  Feedback may be provided, and you might be asked to make further modifications.
3.  After review and approval, and once all CI checks (linters, tests) pass, the PR will be merged.

Thank you for your contributions!
