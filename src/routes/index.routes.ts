import express from "express";
import { Request, Response, NextFunction } from "express";

import prisma from "../db";

const router = express.Router();

// GET games/ - get all games
router.get(
  "/games/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const allGames = await prisma.game.findMany();
      res.json(allGames);
    } catch (err) {
      console.log("Error getting all games from DB", err);
      res.status(500).json({ message: "Error getting all games from DB" });
    }
  }
);

// GET games/:id - get game by Id
router.get(
  "/games/:gameId/",
  async (req: Request, res: Response, next: NextFunction) => {
    const { gameId } = req.params;
    try {
      const game = await prisma.game.findFirst({ where: { id: gameId } });
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
    try {
      const newGame = await prisma.game.create({ data: game });
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
    try {
      const updatedGame = await prisma.game.update({
        where: { id: gameId },
        data: game,
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

export default router;
