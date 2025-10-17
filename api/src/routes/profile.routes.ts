import { Router } from "express";
import { authenticate } from "../middlewares/auth1.middleware";
import { uploader } from "../middlewares/express/uploader";
import { updateProfilePicture , resetPassword, confirmResetPassword } from "../controllers/profile.controller";

const router = Router();

router.put(
    "/picture",
    authenticate,
    uploader("profile" , "profile-pictures").single("photo"),
    updateProfilePicture
);

router.post("/reset-password", resetPassword);
router.post("/reset-password/confirm", confirmResetPassword);

export default router;