const express = require('express');
const app = express();
const cors = require('cors'); 
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/campus-marketplace')
    .then(() => console.log("Connected to MongoDB!"))
    .catch((error) => console.log("Database connection failed:", error));

// ---------------- NODEMAILER SETUP ---------------- //
let transporter;
// Create an Ethereal Account for simulated emails (perfect for testing without a real Gmail password)
nodemailer.createTestAccount().then(account => {
    transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
            user: account.user,
            pass: account.pass
        }
    });
    console.log("-----------------------------------------------------");
    console.log("📧 Nodemailer is Ready! (Ethereal test account)");
    console.log("-----------------------------------------------------");
}).catch(err => console.error("Failed to initialize NodeMailer:", err));

// ---------------- MODELS ---------------- //

const supplierSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    phone: String,
    createdAt: { type: Date, default: Date.now }
});
const Supplier = mongoose.model('Supplier', supplierSchema);

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: { type: String, default: "" },
    category: { type: String, default: "Other" },
    sellerName: { type: String, default: "Unknown" },
    supplierContact: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', productSchema);

const orderSchema = new mongoose.Schema({
    productId: String,
    productName: String,
    price: Number,
    buyerEmail: String,
    sellerEmail: String,
    status: { type: String, default: "Pending" },
    createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ---------------- MIDDLEWARE ---------------- //

app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ---------------- ROUTES ---------------- //

app.get('/', (req, res) => {
    res.send("Welccome to the campus market place API");
});

// --- SUPPLIER ROUTES --- //

app.post('/suppliers', async (req, res) => {
    try {
        let supplier = await Supplier.findOne({ email: req.body.email });
        if (!supplier) {
            supplier = new Supplier(req.body);
            await supplier.save();
            
            // Send Welcome Email if transporter is initialized
            if (transporter) {
                try {
                    const info = await transporter.sendMail({
                        from: '"Campus Marketplace" <no-reply@campusmarket.edu>',
                        to: supplier.email,
                        subject: "Welcome to the Campus Marketplace Supplier Portal! 🎉",
                        text: `Hello ${supplier.name},\n\nWelcome to the Campus Marketplace Supplier Portal!\n\nYour Details:\nName: ${supplier.name}\nEmail: ${supplier.email}\nPhone: ${supplier.phone}\n\nWe look forward to seeing your products on campus!\n\nBest,\nThe Campus Marketplace Team`,
                        html: `
                            <h2>Welcome, ${supplier.name}! 🎉</h2>
                            <p>You have successfully registered as a verified Supplier on the Campus Marketplace.</p>
                            <p><b>Your Configured Details:</b></p>
                            <ul>
                                <li><b>Business Name:</b> ${supplier.name}</li>
                                <li><b>Contact Email:</b> ${supplier.email}</li>
                                <li><b>Phone:</b> ${supplier.phone}</li>
                            </ul>
                            <br/>
                            <p>You can now open the <b>Supplier Dashboard</b> in your app to list items and process orders.</p>
                            <p>Best,<br>The Campus Marketplace Team</p>
                        `
                    });
                    console.log("-----------------------------------------------------");
                    console.log("✅ Welcome Email successfully processed for: " + supplier.email);
                    console.log("👀 PREVIEW EMAIL IN BROWSER: %s", nodemailer.getTestMessageUrl(info));
                    console.log("-----------------------------------------------------");
                } catch (mailErr) {
                    console.log("Error sending email:", mailErr);
                }
            }
        }
        res.status(201).json(supplier);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error creating supplier");
    }
});

app.get('/suppliers/:email', async (req, res) => {
    try {
        const supplier = await Supplier.findOne({ email: req.params.email });
        if (!supplier) return res.status(404).send("Supplier not found");
        res.json(supplier);
    } catch (error) {
        res.status(500).send("Error finding supplier");
    }
});

// --- PRODUCT ROUTES --- //

app.get('/products', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).send("Error fetching products");
    }
});

app.get('/products/supplier/:email', async (req, res) => {
    try {
        const products = await Product.find({ supplierContact: req.params.email }).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).send("Error fetching supplier products");
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).send("Product not found");
        res.json(product);
    } catch (error) {
        res.status(500).send("Error fetching product");
    }
});

app.post('/products', async (req, res) => {
    try {
        const newProduct = new Product(req.body);
        await newProduct.save();
        res.send("Product saved to database successfully!");
    } catch (error) {
        res.status(500).send("Error saving product to database");
    }
});

app.put('/products/:id', async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedProduct) return res.status(404).send("Product not found");
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).send("Error updating product");
    }
});

app.delete('/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).send("Product not found");
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).send("Error deleting product");
    }
});

// --- ORDER ROUTES --- //

app.post('/orders', async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        await newOrder.save();
        res.status(201).send("Order placed successfully!");
    } catch (error) {
        console.error(error);
        res.status(500).send("Error saving order");
    }
});

app.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).send("Error fetching orders");
    }
});

app.get('/orders/supplier/:email', async (req, res) => {
    try {
        const orders = await Order.find({ sellerEmail: req.params.email }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).send("Error fetching supplier orders");
    }
});

app.put('/orders/:id/status', async (req, res) => {
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id, 
            { status: req.body.status }, 
            { new: true }
        );
        if (!updatedOrder) return res.status(404).send("Order not found");
        res.json(updatedOrder);
    } catch (error) {
        res.status(500).send("Error updating order status");
    }
});

// ---------------- SERVER ---------------- //

app.listen(3000, () => {
    console.log("server is running on port 3000");
});