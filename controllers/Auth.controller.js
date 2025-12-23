require('dotenv').config()
const bcrypt=require('bcrypt')
const jwt=require('jsonwebtoken')
const transporter=require('../utils/nodemailerTransporter')
const Users=require('../models/Users.model')

const otpStore=new Map();

// LOGIN

const loginUser=async(req,res)=>{
    try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({
        status: false,
        message: "Username and password are required"
      });
    }

    const checkUser = await Users.findOne({
      where: {username:userName }
    });

    if (!checkUser) {
      return res.status(401).json({
        status: false,
        message: "User not found"
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      checkUser.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        status: false,
        message: "Invalid password"
      });
    }

    // 🔑 JWT token
    const token = jwt.sign(
      {
        id: checkUser.id,
        userName: checkUser.userName,
        email: checkUser.email
      },
      process.env.JWT_SECRET || "manikanta",
      { expiresIn: "1d" }
    );

    // ✅ EXCLUDE password, SEND ALL OTHER FIELDS
    const { password: _, ...userData } = checkUser.toJSON();

    return res.status(200).json({
      status: true,
      message: "Login successful",
      token,
      data: userData
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
}

// REGISTER
const registerUser = async (req,res) => {
try {
    const { userName, name, phone, password, linesHandle } = req.body;

    if (!userName || !name || !phone || !password) {
      return res.status(400).json({
        status: false,
        message: "userName, name, phone and password are required"
      });
    }

    const existingUser = await Users.findOne({
      where: { username:userName }
    });

    if (existingUser) {
      return res.status(409).json({
        status: false,
        message: "Username already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = await Users.create({
      username:userName,
      password: hashedPassword,
      phoneNo:phone,
      name,
      linesHandle: linesHandle || {}             
      
    });

     await newUser.save()
    return res.status(201).json({
      status: true,
      message: "User registered successfully",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// UPDATE USER
const updateUser = async () => {
  try {
    // API call to update user details
  } catch (err) {
    console.error(err);
  }
};

// DELETE USER
const deleteUser = async (req,res) => {
    try {
    const { id } = req.body;     
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "User id is required"
      });
    }

    const checkUser = await Users.findByPk(id);

    if (!checkUser) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }
    await checkUser.destroy();
    return res.status(200).json({
      status: true,
      message: "User deleted successfully"
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// GET ALL USERS
const getAllUsers = async (req,res) => {
  try {
    
    const users = await Users.findAll({
      attributes: { exclude: ["password"] }
    });

    return res.status(200).json({
      status: true,
      message: "Users fetched successfully",
      data: users
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// GET SINGLE USER
const getSingleUser = async (req,res) => {
  try {
    const { id } = req.body; 
    if (!id) {
      return res.status(400).json({
        status: false,
        message: "User id is required"
      });
    }

   
    const user = await Users.findByPk(id, {
      attributes: { exclude: ["password"] } 
    });

    
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }

    
    return res.status(200).json({
      status: true,
      message: "User fetched successfully",
      data: user
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// UPDATE PASSWORD
const updatePassword = async (req,res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;
    if (!username || !oldPassword || !newPassword) {
      return res.status(400).json({
        status: false,
        message: "oldPassword, and newPassword are required"
      });
    }

     const user = await Users.findOne({
      where: { username }
    });
    console.log(user)

    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found"
      });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: false,
        message: "Old password is incorrect"
      });
    }

    // 4️⃣ Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save(); // save updated password

    return res.status(200).json({
      status: true,
      message: "Password updated successfully"
    });

  } catch (err) {
   
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};

// ADD AREA
const addArea = async () => {
  try {
    // API call to add area
  } catch (err) {
    console.error(err);
  }
};

// SEND OTP
const sendOtp = async (req,res) => {
try {
    const { userName } = req.body; 

    if (!userName) {
      return res.status(400).json({
        status: false,
        message: "Username is required"
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    otpStore.set(userName, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 
    });
   console.log(otpStore)
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.SEND_EMAIL,
      subject: "Your OTP Code",
      html: `
        <h2>Your OTP</h2>
        <p>Your OTP is <b>${otp}</b></p>
        <p>This OTP is valid for 5 minutes.</p>
      `
    });

    return res.status(200).json({
      status: true,
      message: "OTP sent successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Failed to send OTP"
    });
  }
};

// VERIFY OTP
const verifyOtp = async (req,res) => {
try {
    const { userName, otp } = req.body;

    if (!userName || !otp) {
      return res.status(400).json({
        status: false,
        message: "Username and OTP are required"
      });
    }


    const storedOtpData = otpStore.get(userName);

    if (!storedOtpData) {
      return res.status(400).json({
        status: false,
        message: "OTP not found or already expired"
      });
    }

    const { otp: storedOtp, expiresAt } = storedOtpData;

   
    if (Date.now() > expiresAt) {
      otpStore.delete(userName); 
      return res.status(400).json({
        status: false,
        message: "OTP expired"
      });
    }

  
    if (Number(otp) !== storedOtp) {
      return res.status(400).json({
        status: false,
        message: "Invalid OTP"
      });
    }

    
    otpStore.delete(userName);
    return res.status(200).json({
      status: true,
      message: "OTP verified successfully"
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: false,
      message: "Internal server error"
    });
  }
};


module.exports={loginUser,registerUser,updatePassword,updateUser,deleteUser,verifyOtp,sendOtp,addArea,getAllUsers,getSingleUser}