const router = require("express").Router();
const userController = require("../controllers/userController");
const { upload ,verifyToken } = require("../middlewares/authen");

/********routes*********/

router.post("/register",upload.single("profilePicture"), userController.register);
router.get("/confirmation/:email/:token", userController.confirmEmail);
router.post("/login",userController.login);

module.exports = router;
