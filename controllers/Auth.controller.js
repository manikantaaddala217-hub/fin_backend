const Users = require("../models/Users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
require("dotenv").config();
const { Resend } = require("resend");
const resend = new Resend("re_5zagYLyK_La8ao54BEosZxQrX8LTm98fW");
const otpStore = {};

const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const user = await Users.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || "your_secret_key",
      { expiresIn: "1d" }
    );

    const { password: _, ...userWithoutPassword } = user.toJSON();

    res.status(200).json({
      message: "Login successful",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const registerUser = async (req, res) => {
  try {
    const { username, password, name, phoneNo, role, linesHandle, email } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: "Username, password, and name are required" });
    }

    const existingUser = await Users.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await Users.create({
      username,
      password: hashedPassword,
      name,
      phoneNo,
      role,
      linesHandle,
      email,
    });

    res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getAllUsersExceptAdmin = async (req, res) => {
  try {
    const users = await Users.findAll({
      where: {
        role: {
          [Op.notILike]: 'admin' // Case-insensitive exclusion
        }
      },
      attributes: { exclude: ["password"] },
      order: [['username', 'ASC']]
    });
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getSingleUser = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await Users.findByPk(id, {
      attributes: { exclude: ["password"] }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching single user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.query;
    const { name, phoneNo, role, linesHandle, password } = req.body;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare update object
    const updateData = {
      name,
      phoneNo,
      role,
      linesHandle,
    };

    // Update password only if provided
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    await user.update(updateData);

    res.status(200).json({
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await Users.findByPk(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.destroy();

    res.status(200).json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const addAreaToUser = async (req, res) => {
  try {
    let { areaName } = req.body;

    // ✅ Simple validation
    if (!areaName) {
      return res.status(400).json({ message: "Area Name is required" });
    }

    // ✅ Trim spaces only
    areaName = areaName.trim();

    const usersAll = await Users.findAll({
      where: { role: "Admin" }
    });

    if (!usersAll || usersAll.length === 0) {
      return res.status(404).json({ message: "No Admin users found" });
    }

    for (const user of usersAll) {
      const existingLinesHandle = Array.isArray(user.linesHandle)
        ? user.linesHandle
        : [];

      if (existingLinesHandle.includes(areaName)) continue;

      const updatedLinesHandle = [
        ...existingLinesHandle,
        areaName
      ];

      await user.update({ linesHandle: updatedLinesHandle });
    }

    res.status(200).json({
      message: `Area '${areaName}' added successfully to all Admin users`
    });

  } catch (error) {
    console.error("Error adding area:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updatePasswordByUsername = async (req, res) => {
  try {
    const { username, newPassword } = req.body;

    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "username and newPassword are required",
      });
    }

    // 🔹 Find user by username
    const user = await Users.findOne({
      where: { username },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 🔹 Hash new password (no comparison with old password)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 🔹 Update password
    await Users.update(
      { password: hashedPassword },
      { where: { username } }
    );

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update password",
      error: error.message,
    });
  }
};

const sendOtpToUser = async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ success: false, message: "Username required" });
    }

    // 🔹 Verify if user exists
    const user = await Users.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "enter the correct username",
      });
    }

    // 🔹 Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // 🔹 Store OTP with expiry (5 minutes)
    otpStore[username] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // 🔹 Send email using Resend
    await resend.emails.send({
      from: "OTP <onboarding@resend.dev>",
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP is ${otp}. Valid for 5 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

const validateOtp = (req, res) => {
  try {
    const { username, otp } = req.body;

    if (!username || !otp) {
      return res.status(400).json({
        success: false,
        message: "Username and OTP are required",
      });
    }

    const storedOtpData = otpStore[username];

    // 🔹 OTP not found
    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        message: "OTP not found or already expired",
      });
    }

    // 🔹 Check expiry
    if (Date.now() > storedOtpData.expiresAt) {
      delete otpStore[username];
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // 🔹 Validate OTP
    if (Number(otp) !== storedOtpData.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // 🔹 Success → remove OTP
    delete otpStore[username];

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Validate OTP Error:", error);
    res.status(500).json({
      success: false,
      message: "OTP validation failed",
    });
  }
};


module.exports = {
  loginUser,
  registerUser,
  getAllUsersExceptAdmin,
  getSingleUser,
  updateUser,
  deleteUser,
  addAreaToUser,
  updatePasswordByUsername,
  validateOtp,
  sendOtpToUser
};
