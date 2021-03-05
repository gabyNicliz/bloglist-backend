const dummy = (blogs) => 1;

const totalLikes = (blogs) => {
  const totalLikesToReturn = blogs.reduce((sum, blog) => sum + blog.likes, 0);


  return blogs.length === 0
    ? 0
    : totalLikesToReturn;
};

const favoriteBlog = (blogs) => {
  // eslint-disable-next-line no-plusplus
  if (blogs.length === 0) return 0;

  let maxBlog = blogs[0];
  for (let i = 1; i < blogs.length; i++) {
    if (blogs[i].likes > maxBlog.likes) {
      maxBlog = blogs[i];
    }
  }

  return maxBlog;
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
};
