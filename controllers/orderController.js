import Order from '../models/Order.js';

export const createOrder = async (req, res) => {
  try {
    const { customer, items, delivery, payment, pricing } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items cannot be empty',
      });
    }

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Incomplete customer delivery information',
      });
    }

    const orderNumber = `ZRZ-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();

    const timeline = [
      {
        title: 'Order Placed',
        description: 'Order registered in Zaraz e-commerce fulfillment system.',
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: now.toLocaleDateString(),
        completed: true,
      },
      {
        title: 'Payment Confirmed',
        description:
          payment?.method === 'cod'
            ? 'Cash on Delivery selected. Verified upon delivery.'
            : `Payment received via ${payment?.method?.toUpperCase()}.`,
        time: 'Instant',
        date: now.toLocaleDateString(),
        completed: true,
      },
      {
        title: 'Packaging & Warehouse QC',
        description: 'Verified 100% authentic item inspected and packed.',
        time: 'Pending',
        date: 'Next step',
        completed: false,
      },
      {
        title: 'Handed over to Express Courier',
        description: 'Out for nationwide transit with tracking partner.',
        time: 'Pending',
        date: 'Upcoming',
        completed: false,
      },
      {
        title: 'Delivered to Customer Doorstep',
        description: 'Signed and delivered at destination.',
        time: 'Pending',
        date: 'Final step',
        completed: false,
      },
    ];

    const order = await Order.create({
      orderNumber,
      customer: {
        name: customer.name,
        email: customer.email?.toLowerCase(),
        phone: customer.phone,
        address: customer.address,
        city: customer.city || 'Dhaka',
        area: customer.area || 'City Center',
        deliveryType: customer.deliveryType || 'home',
      },
      items,
      delivery: {
        method: delivery?.method || 'standard',
        fee: delivery?.fee || 60,
        estimatedDelivery:
          delivery?.method === 'express' ? 'Within 24 Hours' : '2 - 3 Days',
      },
      payment: {
        method: payment?.method || 'cod',
        status:
          payment?.method === 'cod'
            ? 'Pending (Cash On Delivery)'
            : 'Paid Successfully',
        transactionId:
          payment?.transactionId ||
          `TXN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        accountNumber: payment?.accountNumber,
        paidAt: payment?.method !== 'cod' ? now : null,
      },
      pricing: {
        subtotal: pricing?.subtotal || 0,
        shippingFee: pricing?.shippingFee || 60,
        discount: pricing?.discount || 0,
        total: pricing?.total || 0,
      },
      status: 'Order Placed',
      timeline,
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully on Zaraz!',
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { email } = req.query;
    const query = email ? { 'customer.email': email.toLowerCase() } : {};

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    let order;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with identifier: ${id}`,
      });
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching order details',
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    order.status = status;

    // Update timeline stages if applicable
    if (status === 'Processing') {
      if (order.timeline[2]) order.timeline[2].completed = true;
    } else if (status === 'Shipped') {
      if (order.timeline[2]) order.timeline[2].completed = true;
      if (order.timeline[3]) order.timeline[3].completed = true;
    } else if (status === 'Delivered') {
      order.timeline.forEach((step) => (step.completed = true));
      order.payment.status = 'Paid (Delivered)';
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message,
    });
  }
};
