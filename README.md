# Wallet Wise API

Wallet Wise is an API built using [NestJS](https://nestjs.com/) and [TypeScript](https://www.typescriptlang.org/) to manage financial operations efficiently. It uses [MongoDB](https://www.mongodb.com/) as the database, with [Prisma ORM](https://www.prisma.io/) for seamless interaction between the application and the database.

Currently this API is available at: [https://ww-prod.up.railway.app/api](https://ww-prod.up.railway.app/api)

## Table of Contents

- [Getting Started](#getting-started)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Running the Server](#running-the-server)

## Getting Started

To get started with Wallet Wise, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)
- [MongoDB](https://www.mongodb.com/)

This guide will help you install, configure, and run the API.

## Installation

To install the project dependencies, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/nicolaszwier/wallet-wise-api.git
    ```

2. Navigate to the project directory:

    ```bash
    cd wallet-wise-api
    ```

3. Install the required dependencies:

    ```bash
    npm install
    ```

## Database Setup

The application uses MongoDB as its database, connected via Prisma ORM.

1. Set up a MongoDB database either locally or using [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a `.env` file in the root directory with the following variables:

    ```bash
    DATABASE_URL="mongodb+srv://<user>:<password>@clusterapp.jfjccrw.mongodb.net/<database_name>?retryWrites=true&w=majority&appName=ClusterApp"
    JWT_SECRET=unsecure_jwt_secret
    ```

   Replace `<user>`, `<password>`, and `<database_name>` with your MongoDB credentials.

3. Prisma is used to manage the database schema. After updating the Prisma schema file (located at `prisma/schema.prisma`), run the following commands:

    - Format the Prisma schema file:

      ```bash
      npx prisma format
      ```

    - Generate the Prisma client:

      ```bash
      npx prisma generate
      ```

## Running the Server

Once the dependencies and the database are configured, you can run the server in development mode.

To start the server, use the following command:

```bash
npm run start:dev
```

The API will be accessible at `http://localhost:3000`.

## Authors

* **Nicolas Zwierzykowski** - [Nicolas](https://github.com/nicolaszwier)

## License

This project is licensed under the MIT License


