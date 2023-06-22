const User = require("../model/User");

const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { email, pwd, fullname } = req.body;
  const pwdRegex = new RegExp(process.env.PASSWORD_REGEX);
  const emailRegex = new RegExp(process.env.EMAIL_REGEX);
  const fullnameRegex = new RegExp(process.env.FULLNAME_REGEX);

  if (!email || !pwd || !fullname)
    return res.status(400).json({
      error: true,
      message: "Full name, email and password are required",
    });

  const userExists = await User.findOne({ email }).exec();
  if (userExists)
    return res.status(409).json({
      error: true,
      message: "An account already existed with this email. Head to login",
      type: "Duplicate email",
    });

    if (!fullnameRegex.test(fullname)){
        return res.status(400).json({
            "message": "Enter a valid full name",
            "type": "Invalid fullname"
        })
    }



  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: true,
      message: "Enter a valid email",
      type: "Invalid email",
    });
  }

  let pwdErrMsg;

  if (!pwdRegex.test(pwd)) {
    if (pwd.length < 8) {
      pwdErrMsg = "Password must be at least 8 characters long.";
    } else if (!pwd.match(/[a-z]/)) {
      pwdErrMsg = "Password must contain at least one lowercase letter.";
    } else if (!pwd.match(/[A-Z]/)) {
      pwdErrMsg = "Password must contain at least one uppercase letter.";
    } else if (!pwd.match(/\d/)) {
      pwdErrMsg = "Password must contain at least one digit.";
    } else if (!pwd.match(/[@#$%^&+=*!]/)) {
      pwdErrMsg =
        "Password must contain at least one special character (@#$%^&+=*!).";
    } else {
      //   pwdErrMsg = "");
    }
    return res.status(422).json({
        "message": "Password validation failed",
        "type": "Invalid password",
        "pwdCorrectionMsg": pwdErrMsg
    });
  }

  try {
    const newUser = await User.create({
      fullname,
      email,
      password: await bcrypt.hash(pwd, 10),
    });

    res.status(201).json({
      message: "User registered successfully",
      user: newUser,
    });
  } catch (e) {
    res.status(500).json({
      error: true,
      message: `${e.message}`,
    });
  }
};

module.exports = registerUser;
