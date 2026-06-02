import { Router } from "express";
import authRouter from "./authRouter.js";
import profileRouter from "./profileRouter.js";
import certificateRouter from "./certificateRouter.js";
import signRouter from "./signRouter.js";

const mainRouter = Router();

mainRouter.use("/api/auth", authRouter);
mainRouter.use("/api/profile", profileRouter);
mainRouter.use("/api/v1/certificates", certificateRouter);
mainRouter.use("/api/v1/sign", signRouter);

export default mainRouter;
