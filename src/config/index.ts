import express, { Application } from "express";

//Responsible for the messages you see in the terminal as requests are coming in
// https://www.npmjs.com/package/morgan
import logger from "morgan";

//Needed when we deal with cookies (we will when dealing with authentication)
// https://www.npmjs.com/package/cookie-parser
import cookieParser from "cookie-parser";

//Needed to accept requests from 'the outside'. CORS = cross origin resource sharing
//By default express won't accept POST requests unless from the same domain
import cors from "cors";

const FRONTEND_URL: string = process.env.ORIGIN || "http://localhost:3000";

// Middleware configuration
export default (app: Application): void => {
  // Because this is a server that will accept requests from outside and it will be hosted on a server with a `proxy`,
  // express needs to know that it should trust that setting.
  // Services like Heroku use something called a proxy and you need to add this to your server
  app.set("trust proxy", 1);

  // controls a very specific header to pass headers from the frontend
  app.use(
    cors({
      origin: [FRONTEND_URL],
    })
  );

  // In development environment the app logs
  app.use(logger("dev"));

  // To have access to `body` property in the request
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
};
