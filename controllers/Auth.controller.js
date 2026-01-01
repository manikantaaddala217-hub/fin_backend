const Users = require("../models/Users.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

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
        const { username, password, name, phoneNo, role, linesHandle } = req.body;

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
        });

        res.status(201).json({
            message: "User registered successfully",
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

const { Op } = require("sequelize");

const getAllUsersExceptAdmin = async (req, res) => {
    try {
        const users = await Users.findAll({
            where: {
                role: {
                    [Op.notILike]: 'admin' // Case-insensitive exclusion
                }
            },
            attributes: { exclude: ["password"] }
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
        const { name, phoneNo, role, linesHandle } = req.body;

        if (!id) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await Users.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        await user.update({
            name,
            phoneNo,
            role,
            linesHandle
        });

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
        const { areaName, id } = req.body;

        if (!id || !areaName) {
            return res.status(400).json({ message: "User ID and Area Name are required" });
        }

        const user = await Users.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update linesHandle
        const updatedLinesHandle = { ...user.linesHandle };
        updatedLinesHandle[areaName] = { area: true };

        await user.update({
            linesHandle: updatedLinesHandle
        });

        res.status(200).json({
            message: `Area '${areaName}' added successfully`,
            linesHandle: user.linesHandle
        });
    } catch (error) {
        console.error("Error adding area:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    loginUser,
    registerUser,
    getAllUsersExceptAdmin,
    getSingleUser,
    updateUser,
    deleteUser,
    addAreaToUser
};
