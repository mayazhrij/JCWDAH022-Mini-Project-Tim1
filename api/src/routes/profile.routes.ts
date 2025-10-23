import { Router } from "express";
import { authenticate } from "../middlewares/auth1.middleware";
import { uploader } from "../middlewares/express/uploader";
import { updateProfilePicture , resetPassword, confirmResetPassword, changePassword } from "../controllers/profile.controller";

const router = Router();

router.put(
    "/picture",
    authenticate,
    uploader("profile" , "profile-pictures").single("photo"),
    updateProfilePicture
);

router.put("/password", authenticate, changePassword);

router.post("/reset-password", resetPassword);
router.post("/reset-password/confirm", confirmResetPassword);

export default router;