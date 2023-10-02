const router = require("express").Router()
const {getStats} = require("../controllers/getBlogStats.js")
const {blogSearch} = require("../controllers/blogSearchQuery.js")

router.route("/blog-stats").get(getStats)

router.route("/blog-search").get(blogSearch)

module.exports = router