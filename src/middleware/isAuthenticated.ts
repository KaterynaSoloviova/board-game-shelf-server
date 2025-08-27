import { expressjwt as jwt } from "express-jwt";
import { Request } from "express";

// Instantiate the JWT token validation middleware
const isAuthenticated = jwt({
    secret: process.env.TOKEN_SECRET,
    algorithms: ["HS256"],
    requestProperty: "payload",
    getToken: getTokenFromHeaders,
  });
  
  // Function used to extract the JWT token from the request's 'Authorization' Headers
  function getTokenFromHeaders(req : Request) {
    // Check if the token is available on the request Headers
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      // Get the encoded token string and return it
      const token = req.headers.authorization.split(" ")[1];
      if (token === "null") {
        return null;
      }
      return token;
    }
  
    return null;
  }

  export default isAuthenticated;