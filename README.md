# Board Game Shelf Server

A RESTful API server for managing your board game collection, tracking game sessions, and organizing your gaming wishlist. Built with Node.js, Express, TypeScript, and PostgreSQL using Prisma ORM.

## Features

- **Game Management**: Add, update, and delete board games with detailed information
- **Session Tracking**: Record and manage gaming sessions with player information
- **Wishlist System**: Keep track of games you want to buy
- **Player Management**: Manage player profiles and track who played in each session
- **Tag System**: Organize games with custom tags
- **File Attachments**: Link external resources to games (rulebooks, reviews, etc.)
- **Health Monitoring**: Built-in health check endpoint for monitoring

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Package Manager**: npm

## Installation & Setup

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:KaterynaSoloviova/board-game-shelf-server.git
   cd board-game-shelf-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/board_game_shelf"
   TOKEN_SECRET=SomethingSecret1234
   PORT=3000
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev
   ```

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```
   The server will start on `http://localhost:3000` (or the PORT specified in your .env file).

## API Endpoints

### Health Check
- `GET /health` - Check server and database health

### Games
- `GET /games/` - Get all games
- `GET /games/:gameId` - Get game by ID
- `POST /games/` - Create a new game
- `PUT /games/:gameId` - Update a game
- `DELETE /games/:gameId` - Delete a game
- `GET /games/wishlist` - Get wishlist games
- `GET /games/top` - Get top 10 games by session count
- `POST /games/:gameId/addWishlist` - Add game to wishlist
- `POST /games/:gameId/removeWishlist` - Remove from wishlist and mark as owned

### Sessions
- `POST /games/:gameId/sessions/` - Create a new session
- `GET /games/:gameId/sessions` - Get all sessions for a game
- `PUT /sessions/:sessionId` - Update a session
- `DELETE /sessions/:sessionId` - Delete a session

### Players
- `GET /players` - Get all players
- `POST /players` - Create a new player
- `PUT /players/:playerId` - Update a player
- `DELETE /players/:playerId` - Delete a player

### Tags
- `GET /tags` - Get all tags
- `DELETE /tags/:tagId` - Delete a tag

### Files
- `GET /games/:gameId/files` - Get all files for a game
- `POST /games/:gameId/files` - Create a new file attachment
- `DELETE /files/:fileId` - Delete a file

## Data Models

### Game
- Basic info: title, description, genre, publisher, age rating
- Player count: minPlayers, maxPlayers
- Gameplay: playTime (minutes), rating, myRating
- Status: isOwned, coverImage
- Relationships: tags, sessions, wishlist, files

### Session
- Date and notes
- Associated game and players
- Timestamps

### Player
- Name (unique)
- Associated sessions

### Tag
- Title (unique)
- Associated games

### File
- Title and link
- Associated game

### Wishlist
- Reason for wanting the game
- Associated game

## Usage Examples

### Creating a New Game
```bash
curl -X POST http://localhost:3000/games/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Catan",
    "description": "A strategy board game",
    "genre": "Strategy",
    "minPlayers": 3,
    "maxPlayers": 4,
    "playTime": 90,
    "publisher": "Kosmos",
    "age": "10+",
    "rating": 7.5,
    "coverImage": "catan.jpg",
    "isOwned": true,
    "tags": [{"title": "Strategy"}, {"title": "Eurogame"}]
  }'
```

### Adding a Session
```bash
curl -X POST http://localhost:3000/games/gameId123/sessions/ \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15T19:00:00Z",
    "notes": "Great game, everyone loved it!",
    "players": [{"name": "Alice"}, {"name": "Bob"}, {"name": "Charlie"}]
  }'
```

### Adding to Wishlist
```bash
curl -X POST http://localhost:3000/games/gameId456/addWishlist \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Heard great reviews about this game"
  }'
```

## Development

### Project Structure
```
board-game-shelf-server/
├── prisma/                 # Database schema and migrations
├── src/
│   ├── config/            # Configuration files
│   ├── db/                # Database connection
│   ├── error-handling/    # Error handling utilities
│   ├── generated/         # Generated Prisma client
│   ├── routes/            # API route definitions
│   ├── app.ts             # Express app configuration
│   └── server.ts          # Server entry point
├── package.json
└── tsconfig.json
```

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm run build` - Build TypeScript to JavaScript
- `npx prisma studio` - Open Prisma database browser
- `npx prisma migrate dev` - Create and apply new migration
- `npx prisma generate` - Generate Prisma client

### Database Migrations
When you make changes to the Prisma schema:
```bash
npx prisma migrate dev --name description_of_changes
npx prisma generate
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request


## Demo

- **Backend API**: [Board Games Shelf on Render](https://board-game-shelf-server.onrender.com)
- **Frontend Application**: [Deployed on Netlify](https://boardgamesshelf.netlify.app/)
- Monitoring: [UptimeRobot](https://dashboard.uptimerobot.com/monitors/801245467)
- DB: [Supabase](https://supabase.com/dashboard/project/sfxtuxjwotybxffhwqbi)

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact Kateryna Soloviova.

---

**Note**: This is the Backend API repository. The frontend React application can be found [here](https://github.com/KaterynaSoloviova/board-game-shelf-server/issues).

---

**Made with ❤️ by Kateryna Soloviova**
