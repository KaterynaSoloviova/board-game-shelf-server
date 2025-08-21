import express from "express";
import { Request, Response, NextFunction } from "express";

import prisma from "../db";

const router = express.Router();

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  await prisma.game.create({
    data: {
      title: "Cluedo",
      genre: "Crime",
      minPlayers: 2,
      maxPlayers: 6,
      playTime: 60,
      publisher: "",
      age: "+12",
      rating: 10,
      coverImage: "",
      isOwned: true,
    },
  });
  res.json("All good in here");
});

export default router;
