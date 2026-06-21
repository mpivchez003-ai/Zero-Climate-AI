import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import carbonRouter from "./carbon";
import dashboardRouter from "./dashboard";
import goalsRouter from "./goals";
import simulateRouter from "./simulate";
import recommendationsRouter from "./recommendations";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(carbonRouter);
router.use(dashboardRouter);
router.use(goalsRouter);
router.use(simulateRouter);
router.use(recommendationsRouter);
router.use(communityRouter);

export default router;
