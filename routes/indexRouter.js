// routes/indexRouter.js


const express = require("express");
const router = express.Router();              // Router(), NOT express()
const { indexController} = require("../controllers/indexController");

router.get("/", indexController);      // it is the require that does the calling

module.exports = router;