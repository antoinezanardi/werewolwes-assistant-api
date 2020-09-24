/* eslint-disable max-lines-per-function */
const passport = require("passport");
const { body, param } = require("express-validator");
const User = require("../controllers/User");

module.exports = app => {
    /**
     * @apiDefine JWT Bearer Authorization with JSON Web Token.
     */

    /**
     * @apiDefine Basic Basic authentication with username and password.
     */

    /**
     * @apiDefine UserRequestBody
     * @apiParam (Request Body Parameters) {String} email User's email.
     * @apiParam (Request Body Parameters) {String{>=5}} password User's password.
     */

    /**
     * @apiDefine UserResponse
     * @apiSuccess {ObjectID} _id User's ID.
     * @apiSuccess {String} email User's email.
     * @apiSuccess {Date} createdAt When the user is created.
     * @apiSuccess {Date} updatedAt When the user is updated.
     */

    /**
     * @api {GET} /users A] Get users
     * @apiName GetUsers
     * @apiGroup Users 👤
     *
     * @apiPermission Basic
     * @apiUse UserResponse
     */
    app.get("/users", passport.authenticate("basic", { session: false }), User.getUsers);

    /**
     * @api {GET} /users/:id B] Get an user
     * @apiName GetUser
     * @apiGroup Users 👤
     *
     * @apiPermission JWT
     * @apiPermission Basic
     * @apiParam (Route Parameters) {ObjectId} id User's ID.
     * - `JWT Auth`: Only user attached to token can be retrieved from this route.
     * - `Basic Auth`: Any user can be retrieved.
     * @apiUse UserResponse
     */
    app.get("/users/:id", passport.authenticate(["jwt", "basic"], { session: false }), [
        param("id")
            .isMongoId().withMessage("Must be a valid MongoId"),
    ], User.getUser);

    /**
     * @api {POST} /users C] Create new user
     * @apiName CreateUser
     * @apiGroup Users 👤
     *
     * @apiUse UserRequestBody
     * @apiUse UserResponse
     */
    app.post("/users", [
        body("email")
            .isEmail().withMessage("Must be a valid email")
            .trim(),
        body("password")
            .isString().withMessage("Must be a string")
            .isLength({ min: 5 }).withMessage("Must be at least 5 characters long"),
    ], User.postUser);

    /**
     * @api {POST} /users/login D] Login
     * @apiName LoginUser
     * @apiGroup Users 👤
     *
     * @apiUse UserRequestBody
     * @apiSuccess {String} token JSON Web Token to keep for further route authentication.
     */
    app.post("/users/login", [
        body("email")
            .isEmail().withMessage("Must be a valid email")
            .trim(),
        body("password")
            .isString().withMessage("Must be a string")
            .isLength({ min: 5 }).withMessage("Must be at least 5 characters long"),
    ], User.login);
};