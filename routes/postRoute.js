const { postGetController, postPostController, editPostGetController, editPostPostController, deletePostGetController, singlePostView, getAllPost } = require("../controllers/postController");
const { isAuthenticate } = require("../middleware/authMiddleware");
const uploadMiddleware = require("../middleware/uploadMIddleware");
const createPostValidator = require("../validator/dashboard/createPostValidator");
const postRouter = require("express").Router();

postRouter.get("/create-post", isAuthenticate, postGetController);
postRouter.post("/create-post", [isAuthenticate, uploadMiddleware.single("thumbnail"), createPostValidator], postPostController);
postRouter.get("/edit/:postId", [isAuthenticate], editPostGetController)
postRouter.post("/edit/:postId", [isAuthenticate,uploadMiddleware.single("thumbnail"),createPostValidator ], editPostPostController)
postRouter.get("/edit/delete/:postId", [isAuthenticate], deletePostGetController)
postRouter.get("/", [isAuthenticate],getAllPost )
postRouter.get("/:postId", singlePostView)

module.exports = postRouter;
