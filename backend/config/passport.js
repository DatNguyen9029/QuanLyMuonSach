/**
 * Passport.js - Google OAuth 2.0 Strategy
 * Tự động tạo User nếu chưa tồn tại (upsert by googleId)
 */

const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/User.model");
const config = require("./index");

passport.use(
  new GoogleStrategy(
    {
      clientID: config.google.clientId,
      clientSecret: config.google.clientSecret,
      callbackURL: config.google.callbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Tìm user theo googleId hoặc email
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Kiểm tra email đã tồn tại chưa (user đăng ký local trước)
          user = await User.findOneAndUpdate(
            { email: profile.emails[0].value },
            {
              googleId: profile.id,
              hoTen: profile.displayName,
              avatar: profile.photos?.[0]?.value,
            },
            { new: true },
          );
        }

        if (!user) {
          // Tạo tài khoản mới từ Google
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            hoTen: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            role: "user",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    },
  ),
);

// Không dùng session (dùng JWT), nhưng phải khai báo để Passport không báo lỗi
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
