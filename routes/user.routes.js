import { Router } from "express";
import { getUser, getUsers } from "../controllers/user.controller.js";
import { authorize } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.get("/", authorize, getUsers);

userRouter.get("/:id", authorize, getUser);

userRouter.post("", (req, res) => {
  res.send({ message: "CREATE a new user" });
});

userRouter.put("/:id", (req, res) => {
  res.send({ message: "UPDATE user details" });
});
userRouter.delete("/:id", (req, res) => {
  res.send({ message: "DELETE a user" });
});

export default userRouter;
