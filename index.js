const { ApolloServer } = require("apollo-server");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const typeDefs = require("./typeDefs");
const resolvers = require("./resolvers");
const { getUserFromJWT } = require("./helpers/auth");
const { models } = require("./models/index");
const {
  AuthenticatedDirective,
  AuthorizedDirective,
} = require("./directives/AuthDirectives");

const schemaDirectives = {
  authenticated: AuthenticatedDirective,
  authorized: AuthorizedDirective
};

// const server = new ApolloServer({
//   typeDefs,
//   resolvers,
//   schemaDirectives,
//   context: ({ req }) => {
//     // Logic to extract user information from the request and include it in the context
//     return {
//       user: req.user // Assuming user information is attached to the request object
//     };
//   }
// });





const { FormatDateDirective } = require("./directives/GeneralDirectives");

dotenv.config();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    authenticated: AuthenticatedDirective,
    authorized: AuthorizedDirective,
    formatDate: FormatDateDirective,
  },
  context({ req, connection }) {
    if (connection) {
      return { ...connection.context };
    }
    const token = req.headers.authtoken;
    const user = getUserFromJWT(token);
    return {
      models,
      user,
    };
  },
  subscriptions: {
    onConnect(connectionParams) {
      const token = connectionParams.authToken;
      const user = getUserFromJWT(token);
      return {
        models,
        user,
      };
    },
  },
});

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ Connected to MongoDB");
  })
  .catch((err) => {
    console.log(`👉 Error when connecting to DB ${err}`);
  });

server
  .listen(process.env.PORT)
  .then(({ url }) => console.log(`🚀 Server is running on ${url}`));
