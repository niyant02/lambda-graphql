const AWS = require("aws-sdk");
const { ApolloServer, gql } = require("apollo-server-lambda");

const USERS_TABLE = process.env.USERS_TABLE;
const POSTS_TABLE = process.env.POSTS_TABLE;
const dynamoDbClient = new AWS.DynamoDB.DocumentClient({
  region: "us-east-1",
  apiVersion: "2012-08-10",
});

// Schema definition
const typeDefs = gql`
  type User {
    user_id: String
    firstName: String
    lastName: String
    email: String
  }

  type Post {
    post_id: String
    title: String
    content: String
  }

  type Response {
    message: String
    error: String
  }

  input CreateUserInput {
    user_id: String
    firstName: String
    lastName: String
    email: String
  }

  input DeleteUserInput {
    user_id: String
  }

  input CreatePostInput {
    post_id: String
    title: String
    content: String
  }
  input UpdatePostInput {
    title: String
    content: String
  }
  input DeletePostInput {
    post_id: String
  }

  type Query {
    hello: String
    users: [User]
    posts: [Post]
  }

  type Mutation {
    createUser(data: CreateUserInput): Response
    deleteUser(data: DeleteUserInput): Response

    createPost(data: CreatePostInput): Response
    updatePost(postId: String, data: UpdatePostInput): Response
    deletePost(data: DeletePostInput): Response
  }
`;

// Resolver map
const resolvers = {
  Query: {
    hello: () => "Hello world!",
    users: () => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: USERS_TABLE,
        };
        dynamoDbClient.scan(params, (err, data) =>
          err ? reject(err) : resolve(data.Items)
        );
      });
    },
    posts: () => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: POSTS_TABLE,
        };
        dynamoDbClient.scan(params, (err, data) =>
          err ? reject(err) : resolve(data.Items)
        );
      });
    },
  },
  Mutation: {
    createUser: (_root, { data: obj }) => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: USERS_TABLE,
          Item: obj,
        };
        dynamoDbClient.put(params, (err, _data) =>
          err ? reject(err) : resolve({ message: "user created successfully" })
        );
      });
    },
    deleteUser: async (_root, { data: args }) => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: USERS_TABLE,
          Key: args,
        };
        dynamoDbClient.delete(params, (err, _data) =>
          err ? reject(err) : resolve({ message: "user deleted successfully" })
        );
      });
    },
    createPost: async (_root, { data: args }) => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: POSTS_TABLE,
          Item: args,
        };
        dynamoDbClient.put(params, (err, _data) =>
          err ? reject(err) : resolve({ message: "post created successfully" })
        );
      });
    },
    updatePost: async (_root, { postId, data: args }) => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: POSTS_TABLE,
          Key: { post_id: postId },
          UpdateExpression: "set title = :t, content = :s",
          ExpressionAttributeValues: {
            ":t": args.title,
            ":s": args.content,
          },
        };
        dynamoDbClient.update(params, (err, _data) =>
          err ? reject(err) : resolve({ message: "post updated successfully" })
        );
      });
    },
    deletePost: async (_root, { data: args }) => {
      return new Promise((resolve, reject) => {
        const params = {
          TableName: POSTS_TABLE,
          Key: args,
        };
        dynamoDbClient.delete(params, (err, _data) =>
          err ? reject(err) : resolve({ message: "post deleted successfully" })
        );
      });
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: "bounded",
  introspection: true,
});

exports.graphqlHandler = server.createHandler();
