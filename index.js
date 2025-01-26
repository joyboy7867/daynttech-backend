import express from "express"
import dotenv from 'dotenv';
import mongoose from "mongoose";
import bcrypt from "bcrypt"
import cors from "cors"
import jwt from "jsonwebtoken"
const app =express()
dotenv.config();
app.use(cors())
app.use(express.json());
const SECRET_KEY = "Intershipgiveplease";
mongoose
  .connect(process.env.DATABASEURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB", err));

  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  });
  const itemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
  });
  
  const Item = mongoose.model("Item", itemSchema);

  const User = mongoose.model("User", userSchema);
app.post("/api/signup", async (req, res) => {
    
    const { email, password } = req.body;
    console.log(email)
    try {
      // Check if the user already exists
      const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Save the user
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
    res.status(201).json(true);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post("/api/signin", async (req, res) => {
    const { email, password } = req.body;
    console.log("Signin Request:", email, password); // Debugging
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: "1h" });
      res.status(200).json({ token });
    } catch (error) {
      console.error("Signin Error:", error); // Log exact error
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.get("/api/items", async (req, res) => {
    try {
      const items = await Item.find();
      const formattedItems = items.map(item => ({
        id: item._id,
        name: item.name,
        dob: item.dob,
        age: new Date().getFullYear() - new Date(item.dob).getFullYear(),
      }));
      res.status(200).json(formattedItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  
  // Add a new item
  app.post("/api/items", async (req, res) => {
    const { name, dob } = req.body;
    try {
      const newItem = new Item({ name, dob });
      await newItem.save();
      res.status(201).json({ message: "Item added successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add item" });
    }
  });
  
  // Delete an item
  app.delete("/api/items/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await Item.findByIdAndDelete(id);
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete item" });
    }
  });
  
  // Edit an item
  app.put("/api/items/:id", async (req, res) => {
    const { id } = req.params;
    const { name, dob } = req.body;
    try {
      await Item.findByIdAndUpdate(id, { name, dob });
      res.status(200).json({ message: "Item updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  




  app.listen(5000, () => {
    console.log(`Server is running on http://localhost:5000`);
  });
  