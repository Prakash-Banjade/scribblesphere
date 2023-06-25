const Article = require("../model/article.js");
const User = require("../model/User.js");

const getAllArticles = async (req, res) => {
  const articles = await Article.find().populate({
    path: "author",
    select: "-password -refreshToken -email -roles",
  });

  if (!articles || !articles.length) {
    return res.json({
      type: "empty",
      message:
        "No articles published yet. Be the first to publish the article!",
    });
  }

  res.json(articles);
};

const postArticle = async (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content)
    return res.status(400).json({
      message: "Title and content of the article are required",
    });

  const foundArticle = await Article.findOne({ title }).exec();

  if (foundArticle)
    return res.status(409).json({
      message: "Article with the same title already existed",
    });

  const articleTags = tags?.length ? tags.slice(0, 5) : [];

  try {
    const userEmail = req.email;

    const user = await User.findOne({ email: userEmail }).exec();

    const newArticle = await Article.create({
      title: String(title).slice(0, 100),
      content: String(content).slice(0, 5000),
      author: user?._id || "unknown",
      comments: [],
      tags: articleTags,
    });

    res.status(201).json({
      message: "New Article created successfully",
      article: newArticle,
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

const updateArticle = async (req, res) => {
  const { id, title, content, tags } = req.body;

  if (!id)
    return res.status(400).json({
      // servermessage: "id of the article must be passed",
      message: "Something went wrong. Please try again. Report for any inconvinience",
    });

  if (!title || !content)
    return res.status(400).json({
      message: "Title, content are mandatory",
    });

  const foundArticle = await Article.findById(id).populate('author').exec();

  if (!foundArticle)
    return res.status(400).json({
      message: `Unable to update the article. Article with id ${id} not found!`,
    });
  
  if (foundArticle.author.email !== req.email) return res.status(401).json({
    message: 'You are not authorized to update this article'
  })

  const articleTags = tags?.length ? tags.slice(0, 5) : [];

  try {
    foundArticle.title = title;
    foundArticle.content = content;
    foundArticle.tags = articleTags;
    await foundArticle.save();

    res.json({
      message: "Article successfully updated",
      status: 200
    });
  } catch (e) {
    res.status(500).json({
      message: "Unable to save the article. Something went wrong",
    });
  }
};

const deleteArticle = async (req, res) => {
  const { id } = req.body;

  if (!id)
    return res.status(400).json({
      message: "id of the article must be sent",
    });

  const foundArticle = await Article.findById(id).exec();

  if (!foundArticle)
    return res.status(400).json({
      message: `Can't perform delete operation. Article with id ${id} not found`,
    });

  await Article.deleteOne({ _id: id });

  res.sendStatus(204);
};

const findArticleById = async (req, res) => {
  const id = req.params.id;

  if (!id)
    return res.status(400).json({
      message: "id must be passed",
    });

  const foundArticle = await Article.findById(id)
    .populate({
      path: "author",
      select: "-password -refreshToken -email -roles",
    })
    .populate({
      path: "comments.author",
      select: "-password -refreshToken -email -roles",
    })
    .exec();

  if (!foundArticle)
    return res.status(400).json({
      message: `Article with id ${id} not found`,
    });

  res.json(foundArticle);
};

const getUserArticles = async (req, res) => {
  const email = req?.email;
  const limit = req?.query.limit || 0;

  // console.log(`${email} - articles are being`)

  try {
    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser)
      return res.status(400).json({
        message: "Invalid email",
      });

    const articles = await Article.find({})
      .where("author")
      .equals(foundUser._id)
      .limit(limit)
      .populate("author")
      .exec();

    res.json(articles);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

const postComment = async (req, res) => {
  const articleId = req.params.id;
  const { comment } = req.body;

  try {
    const foundArticle = await Article.findById(articleId).exec();

    if (!foundArticle)
      return res.status(404).json({
        message: "Article not found",
      });

    const foundUser = await User.findOne({ email: req.email }).exec();

    const authorId = foundUser._id;

    const newComment = {
      text: comment,
      author: authorId,
    };

    foundArticle.comments.push(newComment);
    foundArticle.save();

    res.json({
      message: "Comment added",
    });
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

const searchArticle = async (req, res) => {
  const searchQuery = req.query.q;

  if (!searchQuery || searchQuery?.length === 0) return res.sendStatus(204);

  try {
    let searchResults = [];

    if (searchQuery.startsWith("#")) {
      // Search by tags
      const tag = searchQuery.substring(1);
      searchResults = await Article.find({ tags: tag }).populate({
        path: "author",
        select: "-password -refreshToken -email -roles",
      });
    } else {
      // Search by title
      searchResults = await Article.find({
        title: { $regex: searchQuery, $options: "i" },
      }).populate({
        path: "author",
        select: "-password -refreshToken -email -roles",
      });
    }

    res.json(searchResults);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "An error occurred while searching for articles." });
  }
};

module.exports = {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
  getUserArticles,
  postComment,
  searchArticle,
};
