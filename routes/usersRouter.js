// routes/usersRouter.js


const express = require("express");
const router = express.Router();              // Router(), NOT express()
const usersController = require("../controllers/usersController");

router.get("/", usersController.usersListGet)
router.get("/create", usersController.usersCreateGet)
router.post("/create", usersController.usersCreatePost)
router.get("/search", usersController.usersSearchGet)



router.get("/:id/update", usersController.usersUpdateGet);
router.post("/:id/update", usersController.usersUpdatePost);
router.post("/:id/delete", usersController.usersDeletePost);





module.exports = router;