# SGMakan 🍜

A personal food discovery platform for Singapore's best food spots. Always finding new food places is difficult, so I built this project to maintain an updated list of favorite spots that I can share with friends.

## About

This project was born out of the frustration of constantly searching for new food spots in Singapore. Instead of relying on scattered recommendations, SGMakan provides a curated, personal list of cafes and restaurants that gets updated regularly. It's designed to be shared with friends, making it easy to discover and recommend great places to eat.

This is also an experimental project to learn and work with [Convex](https://www.convex.dev/) for backend functionality.

## Features

- 🗺️ Explore food spots by neighborhood
- 📍 Detailed place information
- ⏰ Real-time status updates
- 🎨 Modern, responsive UI

## Tech Stack

- React
- Convex (experimental)

## Getting Started

### Prerequisites

- Node.js and npm installed
- A Convex project (run `npm run convex:dev` to create one locally)

### Installation

1. Clone the repository
```bash
git clone https://github.com/Lightningwave/sgmakan
cd sgmakan
```

2. Install dependencies
```bash
npm install
```

3. Configure Convex
- Start Convex dev server (and generate API files): `npm run convex:dev`
- Copy the Convex URL into `.env.local`:
```bash
echo "REACT_APP_CONVEX_URL=https://<your-convex>.convex.cloud" > .env.local
```

4. Seed backend data (cafes + neighborhoods)
```bash
npm run convex:seed
```

5. Start the development server
```bash
npm start
```

Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run convex:dev` - Starts Convex dev server and generates API bindings
- `npm run convex:seed` - Seeds Convex with cafes and neighborhoods

## License

This project is open source and available under the MIT License.
