import { Router } from 'express';
import { signUp, login, getUser } from '../controller/user.controller.js';
import { auth } from '../middlewares/auth.js'; // Assuming you have this file
import { fileHandler } from '../middlewares/multer.middleware.js';

const router = Router();

// Add the multer middleware here. It will run before signUp.
// "profilePic" is the field name you must use in your frontend form (e.g., Postman, FormData)
router.post("/register",  signUp);

router.post("/login", login);
router.get("/getUser", auth, getUser);

export default router;