# Project Overview

This is a WordPress post management system built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. It is designed to be an accessible and user-friendly interface for managing WordPress posts, specifically for an elderly audience. The application uses the WordPress REST API to interact with WordPress.

## Key Technologies

-   **Framework**: Next.js 14 (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS
-   **API**: WordPress REST API
-   **Authentication**: Session-based authentication with a session cookie.
-   **Deployment**: Docker

## Building and Running

### Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Set up environment variables**:
    Create a `.env.local` file with the following content:
    ```env
    # Login Info
    ADMIN_ID=admin
    ADMIN_PASSWORD=yourpassword

    # WordPress Integration
    WORDPRESS_URL=https://your-wordpress-site.com
    WORDPRESS_USERNAME=wp-admin-username
    WORDPRESS_APP_PASSWORD=xxxx xxxx xxxx xxxx
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:3000`.

### Production

The application is designed to be deployed using Docker.

1.  **Build the Docker image**:
    ```bash
    docker-compose build
    ```
2.  **Run the Docker container**:
    ```bash
    docker-compose up -d
    ```
    The application will be available at `http://localhost:8003`.

## Development Conventions

-   **Linting**: The project uses ESLint for code quality. Run `npm run lint` to check for linting errors.
-   **Styling**: The project uses Tailwind CSS for styling. Utility classes should be used whenever possible.
-   **Authentication**: Authentication is handled by a middleware that checks for a session cookie. The middleware protects all routes except for the login page.
-   **Accessibility**: The application is designed to be accessible for elderly users. This includes using large font sizes, high-contrast colors, and spacious layouts.
-   **Security**: The application implements several security best practices, including:
    -   HTTPS is enforced in production.
    -   A strict Content Security Policy (CSP) is in place.
    -   Source maps are disabled in production.
    -   The application runs as a non-root user in the Docker container.
