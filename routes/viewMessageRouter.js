// routes/viewMessageRouter.js


const express = require("express");
const router = express.Router();              // Router(), NOT express()
const { viewMessageController} = require("../controllers/viewMessageController");

router.get("/:messageId", viewMessageController);      // it is the require that does the calling

module.exports = router;