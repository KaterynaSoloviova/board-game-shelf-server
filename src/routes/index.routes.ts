import express from "express";
import { Request, Response, NextFunction } from "express";

import prisma from "../db";

const router = express.Router();

// Helper function to create player connections
async function createPlayerConnections(players: any[] | undefined) {
  let playerConnections: { connect: { id: string }[] } | undefined;
  if (players && players.length > 0) {
    const playerIds: string[] = [];

    for (const player of players) {
      let existingPlayer = await prisma.player.findFirst({
        where: { name: player.name },
      });

      if (!existingPlayer) {
        existingPlayer = await prisma.player.create({
          data: { name: player.name },
        });
      }

      playerIds.push(existingPlayer.id);
    }

    playerConnections = {
      connect: playerIds.map((id) => ({ id })),
    };
  }
  return playerConnections;
}

//Endpoints for Game

// GET games/ - get all games
router.get(
  "/games/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allGames = await prisma.game.findMany({
        include: {
          tags: true,
        },
      });
      res.json(allGames);
    } catch (err) {
      console.log("Error getting all games from DB", err);
      res.status(500).json({ message: "Error getting all games from DB" });
    }
  }
);
// GET games/wishlist - get games from wishlist
router.get("/games/wishlist", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wishlistGames = await prisma.game.findMany({
      include: {
        tags: true,
        wishlist: true,
      },
      where: {
        isOwned: false,
        wishlist: {
          isNot: null,
        },
      },
      orderBy: {
        wishlist: {
          createdAt: "desc",
        },
      },
    });
    res.json(wishlistGames);
  } catch (err) {
    console.log("Error getting wishlist games from DB", err);
    res.status(500).json({ message: "Error getting wishlist games from DB" });
  }
});

// GET games/top - get top 10 games number of sessions
router.get(
  "/games/top",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const topGames = await prisma.game.findMany({
        include: {
          tags: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        orderBy: [
          {
            sessions: {
              _count: "desc",
            },
          },
        ],
        take: 10,
      });
      res.json(topGames);
    } catch (err) {
      console.log("Error getting top games from DB", err);
      res.status(500).json({ message: "Error getting top games from DB" });
    }
  }
);

// GET games/:id - get game by Id
router.get(
  "/games/:gameId/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    try {
      const game = await prisma.game.findFirst({
        where: { id: gameId },
        include: {
          tags: true,
          wishlist: true,
        },
      });
      res.json(game);
    } catch (err) {
      console.log("Error getting game by id from DB", err);
      res.status(500).json({ message: "Error getting game by id from DB" });
    }
  }
);

// POST games/ - create game
router.post(
  "/games/",
  async (req: Request, res: Response, next: NextFunction) => {
    const game = req.body;
    const { tags, ...gameDetail } = game;
    try {
      let tagConnections: { connect: { id: string }[] } | undefined;

      if (tags && tags.length > 0) {
        const tagIds: string[] = [];

        for (const tag of tags) {
          let existingTag = await prisma.tag.findFirst({
            where: { title: tag.title },
          });

          if (!existingTag) {
            existingTag = await prisma.tag.create({
              data: { title: tag.title },
            });
          }

          tagIds.push(existingTag.id);
        }

        tagConnections = {
          connect: tagIds.map((id) => ({ id })),
        };
      }

      const newGame = await prisma.game.create({
        data: {
          ...gameDetail,
          tags: tagConnections,
        },
      });
      res.status(201).json(newGame);
    } catch (err) {
      console.log("Error creating game", err);
      res.status(500).json({ message: "Error creating game" });
    }
  }
);

// PUT games/ - update game
router.put(
  "/games/:gameId",
  async (req: Request, res: Response, next: NextFunction) => {
    const game = req.body;
    const { gameId } = req.params;
    const { tags, ...gameDetail } = game;
    try {
      let tagConnections: { set: { id: string }[] } | undefined;

      if (tags && tags.length > 0) {
        const tagIds: string[] = [];

        for (const tag of tags) {
          let existingTag = await prisma.tag.findFirst({
            where: { title: tag.title },
          });

          if (!existingTag) {
            existingTag = await prisma.tag.create({
              data: { title: tag.title },
            });
          }

          tagIds.push(existingTag.id);
        }

        tagConnections = {
          set: tagIds.map((id) => ({ id })),
        };
      } else {
        // If no tags provided, remove all existing tag connections
        tagConnections = {
          set: [],
        };
      }

      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: {
          ...gameDetail,
          tags: tagConnections,
        },
      });
      res.json(updatedGame);
    } catch (err) {
      console.log("Error updating game", err);
      res.status(500).json({ message: "Error updating game" });
    }
  }
);

// DELETE games/:gameId - delete a game
router.delete(
  "/games/:gameId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    try {
      await prisma.game.delete({ where: { id: gameId } });
      res.status(204).json();
    } catch (err) {
      console.log("Error deleting game", err);
      res.status(500).json({ message: "Error deleting game" });
    }
  }
);

// POST games/:gameId/addWishlist - add game to wishlist
router.post(
  "/games/:gameId/addWishlist",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    const reason = req.body?.reason || "";

    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      if (game.isOwned) {
        return res
          .status(400)
          .json({ error: "Cannot add owned game to wishlist" });
      }

      // Check if already in wishlist
      const existingWishlist = await prisma.wishlist.findUnique({
        where: { gameId },
      });

      if (existingWishlist) {
        return res.status(400).json({ error: "Game is already in wishlist" });
      }

      const wishlist = await prisma.wishlist.create({
        data: {
          gameId,
          reason,
        },
        include: {
          game: true,
        },
      });

      res.status(201).json(wishlist);
    } catch (error) {
      next(error);
    }
  }
);



// POST games/:gameId/removeWishlist - remove game from wishlist and mark as owned
router.post(
  "/games/:gameId/removeWishlist",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;

    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
        include: {
          wishlist: true,
        },
      });

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      if (!game.wishlist) {
        return res.status(400).json({ error: "Game is not in wishlist" });
      }

      // Remove from wishlist and mark as owned
      await prisma.$transaction([
        prisma.wishlist.delete({
          where: { gameId },
        }),
        prisma.game.update({
          where: { id: gameId },
          data: { isOwned: true },
        }),
      ]);

      res
        .status(200)
        .json({ message: "Game removed from wishlist and marked as owned" });
    } catch (error) {
      next(error);
    }
  }
);

//Endpoints for Session

// POST games/:gameId/sessions - create session
router.post(
  "/games/:gameId/sessions/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    const { date, notes, players } = req.body;

    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const playerConnections = await createPlayerConnections(players);
      const session = await prisma.session.create({
        data: {
          date: new Date(date),
          notes,
          game: { connect: { id: gameId } },
          players: playerConnections,
        },
        include: { players: true, game: true },
      });

      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  }
);

// GET games/:gameId/sessions - get sessions
router.get(
  "/games/:gameId/sessions",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;

    try {
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      const sessions = await prisma.session.findMany({
        where: { gameId },
        include: {
          players: true,
        },
        orderBy: { date: "desc" },
      });

      res.status(200).json(sessions);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /sessions/:sessionId - update a session
router.put(
  "/sessions/:sessionId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;
    const { date, notes, players } = req.body;

    try {
      const playerConnections = await createPlayerConnections(players);
      const updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          date: date ? new Date(date) : undefined,
          notes: notes ?? undefined,
          players: playerConnections,
        },
        include: { players: true, game: true },
      });

      res.status(200).json(updatedSession);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /sessions/:sessionId - delete a session
router.delete(
  "/sessions/:sessionId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { sessionId } = req.params;

    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
      res.status(204).send(); // 204 No Content
    } catch (error) {
      next(error);
    }
  }
);

//Endpoints for Tag

// GET /tags - get all tags
router.get("/tags", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { games: true },
    });
    res.status(200).json(tags);
  } catch (error) {
    next(error);
  }
});

// DELETE /tags/:tagId - delete a tag by id
router.delete(
  "/tags/:tagId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { tagId } = req.params;

    try {
      await prisma.tag.delete({
        where: { id: tagId },
      });
      res.status(204).send();
    } catch (err) {
      console.log("Error deleting a session", err);
      res.status(500).json({ message: "Error deleting a session" });
    }
  }
);

//Endpoints for Player

// POST /players - create a new player
router.post(
  "/players",
  async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    try {
      const player = await prisma.player.create({
        data: { name },
      });
      res.status(201).json(player);
    } catch (error) {
      next(error);
    }
  }
);

// GET /players - get all players
router.get(
  "/players",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const players = await prisma.player.findMany({
        include: { sessions: true },
      });
      res.status(200).json(players);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /players/:playerId - update a player
router.put(
  "/players/:playerId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { playerId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    try {
      const updatedPlayer = await prisma.player.update({
        where: { id: playerId },
        data: { name },
      });
      res.status(200).json(updatedPlayer);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /players/:playerId - delete a player
router.delete(
  "/players/:playerId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { playerId } = req.params;

    try {
      await prisma.player.delete({
        where: { id: playerId },
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

//Endpoints for File

// POST /games/:gameId/files - create a new file for a game
router.post(
  "/games/:gameId/files",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    const { title, link } = req.body;

    if (!title || !link) {
      return res.status(400).json({ error: "Title and link are required" });
    }

    try {
      const game = await prisma.game.findUnique({ where: { id: gameId } });
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }

      const file = await prisma.file.create({
        data: {
          title,
          link,
          game: { connect: { id: gameId } },
        },
      });

      res.status(201).json(file);
    } catch (error) {
      next(error);
    }
  }
);

// GET /games/:gameId/files - get all files for a game
router.get(
  "/games/:gameId/files",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;

    try {
      const files = await prisma.file.findMany({
        where: { gameId },
      });

      res.status(200).json(files);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /files/:fileId - delete a file by id
router.delete(
  "/files/:fileId",
  async (req: Request, res: Response, next: NextFunction) => {
    const { fileId } = req.params;

    try {
      await prisma.file.delete({
        where: { id: fileId },
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router;
