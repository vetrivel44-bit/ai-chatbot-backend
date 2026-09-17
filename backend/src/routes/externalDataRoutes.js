const express = require("express");
const { latestNews } = require("../controllers/externalDataController");

const router = express.Router();

router.get("/news/latest", latestNews);

module.exports = router;
