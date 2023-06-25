const express = require("express");
const router = express.Router();

const articleController = require('../controllers/articlesController')

const notificationController = require("../controllers/notificationController");

// Route to fetch notifications for a specific user
router.get("/:userId", notificationController.getNotifications);

// Route to mark a notification as read
router.put(
  "/:notificationId/read",
  notificationController.markNotificationAsRead
);

// Route to add a comment to an article
router.post(
  "/articles/:articleId/comments/:commentIndex",
  notificationController.createNotificationForComment,
  articleController.postComment
);

module.exports = router;
