# RocketChat Gotify Gateway

A custom push notification gateway for Rocket.Chat that redirects notifications to a self-hosted Gotify server, offering a privacy-focused alternative to Google's Firebase Cloud Messaging (FCM).

## Table of Contents

  - [About](https://www.google.com/search?q=%23about)
  - [How it Works](https://www.google.com/search?q=%23how-it-works)
  - [Prerequisites](https://www.google.com/search?q=%23prerequisites)
  - [Installation](https://www.google.com/search?q=%23installation)
  - [Configuration](https://www.google.com/search?q=%23configuration)
      - [Rocket.Chat Settings](https://www.google.com/search?q=%23rocketchat-settings)
  - [Usage](https://www.google.com/search?q=%23usage)
  - [Development](https://www.google.com/search?q=%23development)
  - [License](https://www.google.com/search?q=%23license)
  - [Acknowledgements](https://www.google.com/search?q=%23acknowledgements)

## About

This project provides a custom gateway service for Rocket.Chat, enabling push notifications via a self-hosted Gotify server. It intercepts FCM-compatible requests from Rocket.Chat, processes them, and forwards the content to Gotify. This is ideal for those prioritizing data privacy or operating in environments where Google services are restricted.

## How it Works

1.  **Rocket.Chat Configuration**: Rocket.Chat is set to send push notifications to this gateway's endpoint.
2.  **Gateway Service**:
      * Connects to Rocket.Chat's MongoDB.
      * Automatically provisions Gotify users, applications, and client tokens for each Rocket.Chat user as needed.
      * Listens for changes in Rocket.Chat's push token collection to ensure Gotify configurations stay synchronized.
3.  **Notification Forwarding**: The gateway receives notification payloads from Rocket.Chat, finds the corresponding Gotify application token, and sends the notification to your Gotify server.
4.  **Gotify Delivery**: Gotify then delivers the notification to the user's connected Gotify clients.

## Prerequisites

Ensure you have:

  - **Docker** and **Docker Compose**.
  - **MongoDB**: Your Rocket.Chat's MongoDB instance (gateway needs read/write access to `users` and `_raix_push_app_tokens` collections).
  - **Rocket.Chat**: A running instance.

## Installation

This method uses Docker Compose to run both the gateway and Gotify.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/syblock/rocketchat-gotify-gateway.git
    cd rocketchat-gotify-gateway
    ```

2.  **Create `.env` file:**
    Copy `.env.example` to `.env` and update the values:

    ```ini
    GOTIFY_PORT=8030
    GOTIFY_ADMIN_USERNAME=admin
    GOTIFY_ADMIN_PASSWORD=your_secure_gotify_admin_password

    GATEWAY_PORT=8031

    MONGO_URI="mongodb://localhost:3001/meteor" # Your Rocket.Chat MongoDB URI
    ```

    **Note:** Change `GOTIFY_ADMIN_PASSWORD` from the default.

3.  **Start services:**

    ```bash
    docker-compose up --build -d
    ```

    This builds the gateway, pulls Gotify, starts both containers, and creates a volume for Gotify data.

4.  **Verify running services:**

    ```bash
    docker-compose ps
    ```

    Both `rocketchat-gotify-gateway` and `rocketchat-gotify` should be running.

## Configuration

### Rocket.Chat Settings

Configure Rocket.Chat to use this gateway:

1.  **Log in** to Rocket.Chat as an administrator.
2.  Go to **Administration \> Workspace \> Push**.
3.  **Enable `Enable Gateway`**.
4.  **Set `Gateway` URL**: Enter the base URL of your gateway service. Rocket.Chat will automatically append the necessary path.
      * Example (same host): `http://localhost:8031`
      * Example (different host): `http://your-gateway-ip:8031`
5.  **Save Changes**.

## Usage

After setup:

1.  Ensure **MongoDB is accessible** from the gateway.
2.  **Send a test notification** from Rocket.Chat (e.g., a direct message to yourself).
3.  Verify the notification is received on your device via Gotify.

You can also test the gateway directly for debugging:
`http://localhost:8031/test/<your_gotify_app_token>`

## Development

For development:

1.  **Prerequisites**: Docker, Docker Compose, and Bun.
2.  **Clone** the repository.
3.  **Set up `.env`** as in installation.
4.  **Run with live reload**: The `docker-compose.yml` uses a volume mount and `CMD bun run dev` for automatic restarts on code changes.
    ```bash
    docker-compose up --build -d
    ```
    This will start the server and watch for file changes inside the container.

The project uses `Elysia` (web server), `ofetch` (HTTP), and `mongodb` (database).

## License

This project is licensed under the MIT License - see the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

## Acknowledgements

  - [Rocket.Chat](https://rocket.chat/): Open-source communication platform.
  - [Gotify](https://gotify.net/): Self-hosted push notification system.
  - [Elysia](https://elysiajs.com/): Fast web framework.
  - [Bun](https://bun.sh/): Incredibly fast JavaScript runtime.
  - Inspired by [immanuelfodor/rocketchat-push-gateway](https://github.com/immanuelfodor/rocketchat-push-gateway): A project that provided valuable insights and inspiration.