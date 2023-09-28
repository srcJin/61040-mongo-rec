import { Filter, ObjectId } from "mongodb";

import { Router, getExpressRouter } from "./framework/router";

import { Post, User, WebSession } from "./app";
import { PostDoc } from "./concepts/post";
import { UserDoc } from "./concepts/user";
import { WebSessionDoc } from "./concepts/websession";

class Routes {
  @Router.get("/session")
  async getSessionUser(session: WebSessionDoc) {
    const user = WebSession.getUser(session);
    return await User.getById(user);
  }

  @Router.get("/users")
  async getUsers() {
    return await User.getUsers();
  }

  @Router.get("/users/:username")
  async getUser(username: string) {
    return (await User.getUsers(username))[0];
  }

  @Router.post("/users")
  async createUser(session: WebSessionDoc, username: string, password: string) {
    WebSession.isLoggedOut(session);
    return await User.create(username, password);
  }

  @Router.patch("/users")
  async updateUser(session: WebSessionDoc, update: Partial<UserDoc>) {
    const user = WebSession.getUser(session);
    return await User.update(user, update);
  }

  @Router.post("/login")
  async logIn(session: WebSessionDoc, username: string, password: string) {
    const u = await User.authenticate(username, password);
    WebSession.start(session, u._id);
    return { msg: "Logged in!" };
  }

  @Router.post("/logout")
  async logOut(session: WebSessionDoc) {
    WebSession.end(session);
    return { msg: "Logged out!" };
  }

  @Router.get("/posts")
  async getPosts(query: Filter<PostDoc>) {
    return await Post.read(query);
  }

  @Router.post("/posts")
  async createPost(session: WebSessionDoc, content: string) {
    const user = WebSession.getUser(session);
    return await Post.create(user, content);
  }

  @Router.delete("/posts/:_id")
  async deletePost(session: WebSessionDoc, _id: ObjectId) {
    // TODO 3: Delete the post with given _id
    // Make sure the user deleting is the author of the post

    // get posts
    // console.log("getPosts=", Post.read(query));

    if (!session.user) {
      throw new Error("User not authenticated");
    }

    const post = await Post.read({ _id });
    // console.log("post=", post);
    if (post.length === 0) {
      throw new Error("Post not found");
    }

    const user = await User.getById(session.user);

    // console.log("post=", post);
    // console.log("delete post ,post id =", _id);
    // console.log("delete post ,user =", user);

    // if user exists
    if (user) {
      // console.log("post[0].author=", post[0].author);
      // console.log("user._id", user._id);
      // test if the post author id equals to user id
      if (post[0].author.toString() !== user._id.toString()) {
        throw new Error("Current User is not the author");
      } else {
        // if yes, then delete the post
        return await Post.delete(_id);
      }
    } else {
      throw new Error("User not found");
    }

    // console.log("session=", session);
    // console.log("session.user =", session.user);
  }
}

export default getExpressRouter(new Routes());
