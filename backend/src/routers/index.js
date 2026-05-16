import { Router } from "express";
import authRouter from "./authRouter.js";
import profileRouter from "./profileRouter.js";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/profile", profileRouter);

export default mainRouter;
