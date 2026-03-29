const express = require('express');
const app = express();
const cors = require('cors'); 
const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/campus-marketplace')
    .then(() => console.log("Connected to MongoDB!"))
    .catch((error) => console.log("Database connection failed:", error));
const productSchema = new mongoose.Schema({
    name: String,
    price: Number 
});

const Product = mongoose.model('Product', productSchema);
app.use(cors()); 
app.use(express.json());

app.get('/',(req, res) => {
    res.send("Welccome to the campus market place API");
});
app.get('/products', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const requestedId = req.params.id;
    res.send("you asked for product ID: " + requestedId);
});
app.post('/products', async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.send("Product saved to database successfully!");
});
app.listen(3000, () => {
    console.log("server is running on port 3000");
});