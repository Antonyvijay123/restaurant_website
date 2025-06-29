const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');
require('dotenv').config();

const app  = express();
const PORT = process.env.PORT;

/* ────────────────  middleware  ──────────────── */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ────────────────  DB connection  ──────────────── */
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI,
      
      { useNewUrlParser: true, useUnifiedTopology: true }
    );
    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

/* ────────────────  Order model  ──────────────── */
const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    foodItem:     { type: String, required: true, trim: true },
    quantity:     { type: Number, required: true, min: 1 },
    address:      { type: String, required: true, trim: true },
    orderDate:    { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['pending','confirmed','preparing','delivered','cancelled'],
      default: 'pending'
    },
    totalAmount:  { type: Number, default: 20 }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);

/* ────────────────  routes  ──────────────── */
app.get('/', (_req, res) => {
  res.json({ message: 'Restaurant Backend API is running!' });
});

// Create
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, mobileNumber, foodItem, quantity, address } = req.body;
    if (!customerName || !mobileNumber || !foodItem || !quantity || !address) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const newOrder   = new Order({ customerName, mobileNumber, foodItem,
                                   quantity: Number(quantity), address });
    const savedOrder = await newOrder.save();
    res.status(201).json({ success: true, message: 'Order placed successfully!',
                           orderId: savedOrder._id, order: savedOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ success: false, message: 'Failed to place order', error: err.message });
  }
});

// Read all
app.get('/api/orders', async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, count: orders.length, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch orders', error: err.message });
  }
});

// Read one
app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch order', error: err.message });
  }
});

// Update
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id, { status }, { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order updated successfully', order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ success: false, message: 'Failed to update order', error: err.message });
  }
});

// Delete
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ success: false, message: 'Failed to delete order', error: err.message });
  }
});

/* ────────────────  generic error & 404  ──────────────── */
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!', error: err.message });
});

app.use((_req, res) => {                     // ← catch‑all 404
  res.status(404).json({ success: false, message: 'Route not found' });
});

/* ────────────────  start server  ──────────────── */
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
startServer();
