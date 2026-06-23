// controllers/usersController.js


const usersStorage = require("../data/usersStorage")

const { body, validationResult, matchedData} = require("express-validator")
//body(...)           → define + run the rules        (the rulebook)
//validationResult(req) → did anything fail?           (the verdict)
//matchedData(req)    → give me the clean values       (the cleaned result)
const alphaErr = "must only contain letters"
const lengthErr = "must be between 1 and 10 characters"

exports.usersListGet = (req,res) => {
    res.render("index",{
        title : "Users List",
        users: usersStorage.getUsers()
    })
}
exports.usersCreateGet = (req,res) => {
    res.render("createUser", {
        title: "Create User",
    })
}





const validateUser = [
  body("firstName").trim()
    .isAlpha().withMessage(`First name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`First name ${lengthErr}`),
  body("lastName").trim()
    .isAlpha().withMessage(`Last name ${alphaErr}`)
    .isLength({ min: 1, max: 10 }).withMessage(`Last name ${lengthErr}`),
]; // a function to validate the format of user

exports.usersCreatePost = [
  validateUser,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("createUser", {
        title: "Create user",
        errors: errors.array(),
      });
    }
    const { firstName, lastName } = matchedData(req);
    usersStorage.addUser({ firstName, lastName });
    res.redirect("/");
  }
];

exports.usersUpdateGet = (req, res) => {
  const user = usersStorage.getUser(req.params.id);
  res.render("updateUser", {
    title: "Update user",
    user: user,
  });
};

exports.usersUpdatePost = [
  validateUser, //obligatoire
  (req, res) => {
    const user = usersStorage.getUser(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render("updateUser", {
        title: "Update user",
        user: user,
        errors: errors.array(),
      });
    }
    const { firstName, lastName } = matchedData(req);
    usersStorage.updateUser(req.params.id, { firstName, lastName });
    res.redirect("/");
  }
];

exports.usersDeletePost = (req, res) => {
  usersStorage.deleteUser(req.params.id);
  res.redirect("/");
};

