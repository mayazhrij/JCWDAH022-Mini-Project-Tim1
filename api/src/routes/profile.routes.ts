import { Router } from "express";
import { authenticate } from "../middlewares/auth1.middleware";
import { uploader } from "../middlewares/express/uploader";
import { updateProfilePicture } from "../controllers/profile.controller";

const router = Router();

router.put(
    "/picture",
    authenticate,
    uploader("profile" , "profile-pictures").single("photo"),
    updateProfilePicture
);

export default router;