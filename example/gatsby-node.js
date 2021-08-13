const fetch = require('node-fetch');
const { createRemoteFileNode } = require('gatsby-source-filesystem');

exports.createPages = async ({ actions, graphql }) => {
  const { createPage, createRedirect } = actions;

  createPage({
    path: `/custom`,
    component: require.resolve(`./src/templates/custom.js`),
    context: {
      title: 'A Custom Page!',
      meta: {
        description: `A custom page with context.`,
      },
    },
  });

  const result = await graphql(`
    query GetBooks {
      allBook {
        nodes {
          id
          series
          name
        }
      }
    }
  `);

  const books = result.data.allBook.nodes;

  books.forEach((book) => {
    const bookSlug = book.name.toLowerCase().replace(/\W+/g, '-');

    if (book.series === null) {
      createPage({
        path: `/book/${bookSlug}`,
        component: require.resolve(`./src/templates/book.js`),
        context: {
          id: book.id,
        },
      });
    } else {
      const seriesSlug = book.series.toLowerCase().replace(/\W+/g, '-');

      createPage({
        path: `/book/${seriesSlug}/${bookSlug}`,
        component: require.resolve(`./src/templates/book.js`),
        context: {
          id: book.id,
        },
      });
    }
  });
};

exports.sourceNodes = ({ actions, createNodeId, createContentDigest }) => {
  const { createNode, createTypes } = actions;

  const authors = [
    {
      slug: 'n-k-jemisin',
      name: 'N. K. Jemisin',
    },
    {
      slug: 'blake-crouch',
      name: 'Blake Crouch',
    },
    {
      slug: 'fredrik-backman',
      name: 'Fredrik Backman',
    },
  ];

  const books = [
    {
      isbn: 9780316229296,
      name: 'The Fifth Season',
      author: 'n-k-jemisin',
      series: 'The Broken Earth Trilogy',
      seriesOrder: 1,
    },
    {
      isbn: 9780316229265,
      name: 'The Obelisk Gate',
      author: 'n-k-jemisin',
      series: 'The Broken Earth Trilogy',
      seriesOrder: 2,
    },
    {
      isbn: 9780316229241,
      name: 'The Stone Sky',
      author: 'n-k-jemisin',
      series: 'The Broken Earth Trilogy',
      seriesOrder: 3,
    },
    {
      isbn: 9781101904244,
      name: 'Dark Matter',
      author: 'blake-crouch',
      series: null,
      seriesOrder: null,
    },
    {
      isbn: 9781476738024,
      name: 'A Man Called Ove',
      author: 'fredrik-backman',
      series: null,
      seriesOrder: null,
    },
  ];

  authors.forEach((author) => {
    createNode({
      ...author,
      id: createNodeId(`author-${author.slug}`),
      parent: null,
      children: [],
      internal: {
        type: 'Author',
        content: JSON.stringify(author),
        contentDigest: createContentDigest(author),
      },
    });
  });

  books.forEach((book) => {
    createNode({
      ...book,
      id: createNodeId(`book-${book.isbn}`),
      parent: null,
      children: [],
      internal: {
        type: 'Book',
        content: JSON.stringify(book),
        contentDigest: createContentDigest(book),
      },
    });
  });

  createTypes(`
    type Author implements Node {
      id: ID!
      name: String!
      slug: String!
      books: [Book!]! @link(from: "slug" by: "author.slug")
    }

    type Book implements Node {
      id: ID!
      name: String!
      isbn: ID!
      series: String
      seriesOrder: Int
      author: Author @link(from: "author" by: "slug")
      buyLink: String!
      cover: File!
    }
  `);
};

exports.createResolvers = ({
  actions,
  cache,
  createNodeId,
  createResolvers,
  store,
  reporter,
}) => {
  const { createNode } = actions;
  const resolvers = {
    Book: {
      buyLink: {
        resolve: (source) =>
          `https://www.powells.com/searchresults?keyword=${source.isbn}`,
      },
      cover: {
        type: 'File',
        resolve: async (source) => {
          const response = await fetch(
            `https://openlibrary.org/isbn/${source.isbn}.json`,
          );

          if (!response.ok) {
            reporter.warn(
              `Error loading details about ${source.name} — got ${response.status} ${response.statusText}`,
            );
            return null;
          }

          const { covers } = await response.json();

          if (covers.length) {
            return createRemoteFileNode({
              url: `https://covers.openlibrary.org/b/id/${covers[0]}-L.jpg`,
              store,
              cache,
              createNode,
              createNodeId,
              reporter,
            });
          } else {
            return null;
          }
        },
      },
    },
  };

  createResolvers(resolvers);
};
