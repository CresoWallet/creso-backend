# Creso Server

This is the README file for Creso Server, an API built using Express.js. It is designed to work alongside a Next.js frontend application. 

## Getting Started

These instructions will help you get the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following installed on your system:

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Installation

1. Clone the repository:
```ruby
git clone https://github.com/CresoWallet/creso-backend.git
```
2. Change into the project directory:
```ruby
cd creso-backend.git
```
3. Install dependencies:
```ruby
npm install
```

4. Your project includes a `.env` file for development purposes
. Make sure to update the values in the .env file as needed.


## Available Scripts

In the project directory, you can run:

### `npm run build`

Builds the app for production by running the TypeScript compiler. The compiled JavaScript files will be output in the `dist` folder.

### `npm run watch`

Runs the TypeScript compiler in watch mode. The compiled JavaScript files will be output in the `dist` folder, and the compiler will watch for changes and recompile when necessary.

### `npm run dev`

Runs the app in development mode using `nodemon` with the compiled JavaScript files in the `dist` folder. The app will reload if you make edits.

### `npm start`

Runs the app in production mode using the compiled JavaScript files in the `dist` folder.

### `npm run start2`

Runs the app in production mode using `ts-node` with the TypeScript files in the `src` folder.

### `npm run dev2`

Runs the app in development mode using `nodemon` with the TypeScript files in the `src` folder. The app will reload if you make edits.


## Contributing

Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
