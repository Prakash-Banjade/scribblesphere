const Article = require("../model/article.js");
const User = require("../model/User.js");

const getAllArticles = async (req, res) => {
  const articles = await Article.find();

  if (!articles || !articles.length) {
    return res.json({
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
      message: "Title, content and the author of the article are required",
    });

  const foundArticle = await Article.findOne({ title }).exec();

  if (foundArticle)
    return res.status(409).json({
      message: "Article with the same title already existed",
    });

  const articleTags = tags?.length ? tags : [];

  try {
    const userEmail = req.email;

    const user = await User.findOne({email: userEmail}).exec()

    const newArticle = await Article.create({
      title,
      content,
      author: user?._id || 'unknown',
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
  const { id, title, content, author, tags } = req.body;

  if (!id)
    return res.status(400).json({
      message: "id of the article must be passed",
    });

  if (!title || !content || !author)
    return res.status(400).json({
      message: "Title, content and author are mandatory",
    });

  const foundArticle = await Article.findById(id).exec();

  if (!foundArticle)
    return res.status(400).json({
      message: `Unable to update the article. Article with id ${id} not found!`,
    });

  try {
    foundArticle.title = title;
    foundArticle.content = content;
    foundArticle.author = author;
    foundArticle.tags = tags;
    await foundArticle.save();

    res.json({
      message: "Article successfully updated",
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

  const foundArticle = await Article.findById(id).exec();

  if (!foundArticle)
    return res.status(400).json({
      message: `Article with id ${id} not found`,
    });

  res.json(foundArticle);
};

const getUserArticles = async (req, res) => {
  const email = req?.email;

  try {
    const foundUser = await User.findOne({ email }).exec();

    if (!foundUser)
      return res.status(400).json({
        message: "Invalid email",
      });

    const articles = await Article.find({}).where('author').equals(foundUser._id).exec();

    res.json(articles);
  } catch (e) {
    res.status(500).json({
      message: e.message,
    });
  }
};

module.exports = {
  getAllArticles,
  postArticle,
  updateArticle,
  deleteArticle,
  findArticleById,
  getUserArticles,
};
