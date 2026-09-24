const Order = require('../models/Order');
const Product = require('../models/Product');
const StoreStock = require('../models/StoreStock');
const DarkStore = require('../models/DarkStore');
const ApiError = require('../utils/ApiError');

// Module 4: Order Placement with Nearest-Store Check
// @route POST /api/orders
const placeOrder = async (req, res, next) => {
  try {
    const { items, deliveryAddress, deliverySlot, storeId: preferredStoreId } = req.body;
    const customerId = req.user._id;

    // Resolve which store serves this order: either the one given, or the
    // customer's serviceableArea matched against dark stores.
    let store;
    if (preferredStoreId) {
      store = await DarkStore.findById(preferredStoreId);
    } else if (req.user.serviceableArea) {
      store = await DarkStore.findOne({ area: req.user.serviceableArea, isActive: true });
    }
    if (!store) throw new ApiError(400, 'No serviceable dark store found for this order');

    // Validate stock at that store for every item and build snapshotted line items
    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        throw new ApiError(404, `Product ${item.productId} not found`);
      }

      const stock = await StoreStock.findOne({ storeId: store._id, productId: product._id });
      if (!stock || stock.quantity < item.quantity) {
        throw new ApiError(409, `Insufficient stock for ${product.name} at ${store.name}`);
      }

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
      totalAmount += product.price * item.quantity;
    }

    // Deduct stock now that validation passed
    for (const item of items) {
      await StoreStock.updateOne(
        { storeId: store._id, productId: item.productId },
        { $inc: { quantity: -item.quantity } }
      );
    }

    const order = await Order.create({
      customerId,
      storeId: store._id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      deliverySlot, // Module 10: Delivery Time Slot Selection
      status: 'placed',
      statusHistory: [{ status: 'placed', note: 'Order placed by customer' }],
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Module 5: Order Picking & Packing Workflow
// @route PUT /api/orders/:id/pick  -> staff starts picking
const startPicking = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'placed') {
      throw new ApiError(400, `Cannot start picking from status '${order.status}'`);
    }

    order.status = 'picking';
    order.pickStartedAt = new Date();
    order.statusHistory.push({ status: 'picking', note: `Picking started by ${req.user.name}` });
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/orders/:id/pack -> staff marks order packed
const markPacked = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'picking') {
      throw new ApiError(400, `Cannot pack an order from status '${order.status}'`);
    }

    order.status = 'packed';
    order.packedAt = new Date();
    order.statusHistory.push({ status: 'packed', note: `Packed by ${req.user.name}` });
    await order.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Module 6: Delivery Partner Assignment
// @route PUT /api/orders/:id/assign
const assignDeliveryPartner = async (req, res, next) => {
  try {
    const DeliveryPartner = require('../models/DeliveryPartner');
    const { deliveryPartnerId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.status !== 'packed') {
      throw new ApiError(400, `Order must be packed before assignment (current: '${order.status}')`);
    }

    const partner = await DeliveryPartner.findById(deliveryPartnerId);
    if (!partner || !partner.isAvailable) {
      throw new ApiError(400, 'Delivery partner not available');
    }

    order.deliveryPartnerId = partner._id;
    order.status = 'assigned';
    order.statusHistory.push({ status: 'assigned', note: `Assigned to partner ${partner._id}` });
    await order.save();

    partner.isAvailable = false;
    partner.currentOrderId = order._id;
    await partner.save();

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Module 7: Delivery Status Tracking
// @route PUT /api/orders/:id/status  body: { status: 'out_for_delivery' | 'delivered' | 'failed' }
const updateDeliveryStatus = async (req, res, next) => {
  try {
    const DeliveryPartner = require('../models/DeliveryPartner');
    const { status, note } = req.body;

    const allowedTransitions = {
      assigned: ['out_for_delivery'],
      out_for_delivery: ['delivered', 'failed'],
    };

    const order = await Order.findById(req.params.id);
    if (!order) throw new ApiError(404, 'Order not found');

    const allowedNext = allowedTransitions[order.status] || [];
    if (!allowedNext.includes(status)) {
      throw new ApiError(400, `Cannot move from '${order.status}' to '${status}'`);
    }

    order.status = status;
    order.statusHistory.push({ status, note });
    if (status === 'delivered') order.deliveredAt = new Date();

    // Free up the delivery partner once the order is terminally delivered/failed
    if (status === 'delivered' || status === 'failed') {
      if (order.deliveryPartnerId) {
        await DeliveryPartner.findByIdAndUpdate(order.deliveryPartnerId, {
          isAvailable: true,
          currentOrderId: null,
        });
      }
    }

    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Module 8: Real-Time Order Status for Customer
// @route GET /api/orders/:id
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('storeId', 'name area')
      .populate('deliveryPartnerId');

    if (!order) throw new ApiError(404, 'Order not found');

    // Customers may only view their own orders
    if (req.user.role === 'customer' && order.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to view this order');
    }

    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Module 11: Customer Order History & Reorder
// @route GET /api/orders/my
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/orders/:id/reorder -> places a new order with the same items
const reorder = async (req, res, next) => {
  try {
    const oldOrder = await Order.findById(req.params.id);
    if (!oldOrder) throw new ApiError(404, 'Original order not found');
    if (oldOrder.customerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'Not authorized to reorder this order');
    }

    req.body.items = oldOrder.items.map((i) => ({ productId: i.productId, quantity: i.quantity }));
    req.body.storeId = oldOrder.storeId;
    req.body.deliveryAddress = req.body.deliveryAddress || oldOrder.deliveryAddress;

    return placeOrder(req, res, next);
  } catch (err) {
    next(err);
  }
};

// List orders for a store (staff dashboard), optionally by status
const getStoreOrders = async (req, res, next) => {
  try {
    const { storeId, status } = req.query;
    const filter = {};
    if (storeId) filter.storeId = storeId;
    if (status) filter.status = status;
    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  placeOrder,
  startPicking,
  markPacked,
  assignDeliveryPartner,
  updateDeliveryStatus,
  getOrderById,
  getMyOrders,
  reorder,
  getStoreOrders,
};
