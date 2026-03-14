import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import jwt from 'jsonwebtoken'

// API for adding doctor
const addDoctor = async (req, res) => {
  try {

    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      available,
      address
    } = req.body;

    const imageFile = req.file;
    if (!imageFile) {
      return res.json({ success: false, message: "Image is required" });
    }

    // Checking for all required data
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res.json({ success: false, message: "Missing Details" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Please enter a valid email" });
    }

    // Validate password length
    if (password.length < 8) {
      return res.json({ success: false, message: "Please enter a strong password" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to Cloudinary
    const imageUpload = await cloudinary.uploader.upload(
      imageFile.path,
      { resource_type: "image" }
    );
    const imageUrl = imageUpload.secure_url; // real uploaded URL

    // Safely parse address
    let parsedAddress;
    try {
      parsedAddress = JSON.parse(address);
    } catch {
      parsedAddress = address; // keep string if not JSON
    }

    // Doctor Data
    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: parsedAddress,
      available: available ?? true,
      date: Date.now(),
    };

    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();

    res.json({ success: true, message: "Doctor Added" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API For admin Login
const loginAdmin = async (req, res) => {
  try {

    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1d" });
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select('-password');
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}

export { addDoctor, loginAdmin, allDoctors };