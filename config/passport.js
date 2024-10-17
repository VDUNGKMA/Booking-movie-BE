// // config/passport.js
// const passport = require('passport');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const authController = require('../controllers/auth.controller');

// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: process.env.GOOGLE_CALLBACK_URL,
//         },
//         authController.googleAuthHandler // Chuyển phần xử lý sang controller
//     )
// );

// passport.serializeUser((user, done) => done(null, user.id));
// passport.deserializeUser(authController.deserializeUser);

// module.exports = passport;
