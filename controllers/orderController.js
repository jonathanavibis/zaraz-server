import Order from '../models/Order.js';
import { renderBaseLayout, isHtmlRequest } from '../utils/viewRenderer.js';

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
            : `Payment received via ${payment?.method?.toUpperCase() || 'ONLINE'}.`,
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
      timeline,
      status: 'Order Placed',
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully in Zaraz fulfillment database',
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

    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const rowsHtml = orders.length === 0
        ? `<tr><td colspan="7" style="text-align: center; padding: 3rem; color: var(--muted);">No customer orders placed yet. Click "+ Create Sample Order" below to test the logistics pipeline.</td></tr>`
        : orders.map((o) => {
            const itemCount = o.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
            const statusColors = {
              'Order Placed': '#38bdf8',
              'Payment Verified': '#fbbf24',
              'Processing': '#c084fc',
              'Shipped': '#f59e0b',
              'Out for Delivery': '#fb923c',
              'Delivered': '#34d399',
              'Cancelled': '#f87171',
            };
            const color = statusColors[o.status] || '#10b981';

            return `
            <tr>
              <td>
                <a href="/orders/${o.orderNumber}" style="font-weight: 700; color: #fff; font-family: 'JetBrains Mono', monospace; text-decoration: none;">
                  ${o.orderNumber}
                </a>
                <div style="font-size: 0.7rem; color: var(--muted);">${new Date(o.createdAt).toLocaleDateString()}</div>
              </td>
              <td>
                <div style="font-weight: 600; color: #fff;">${o.customer?.name || 'Customer'}</div>
                <div style="font-size: 0.72rem; color: var(--muted);">${o.customer?.email} &bull; ${o.customer?.phone}</div>
              </td>
              <td>
                <span style="font-weight: 600;">${itemCount} Items</span>
                <div style="font-size: 0.72rem; color: var(--muted); max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${o.items?.[0]?.title || 'Products'}
                </div>
              </td>
              <td>
                <strong style="color: var(--emerald-light); font-size: 0.95rem;">৳${o.pricing?.total?.toLocaleString()}</strong>
              </td>
              <td>
                <span class="badge-pill" style="background: rgba(255, 255, 255, 0.08); text-transform: uppercase;">
                  ${o.payment?.method || 'COD'}
                </span>
                <div style="font-size: 0.68rem; color: #34d399; margin-top: 0.2rem;">${o.payment?.status || 'Pending'}</div>
              </td>
              <td>
                <select onchange="handleUpdateStatus('${o._id}', this.value)" style="background: #060c14; border: 1px solid ${color}; color: ${color}; padding: 0.25rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; outline: none; cursor: pointer;">
                  <option value="Order Placed" ${o.status === 'Order Placed' ? 'selected' : ''}>Order Placed</option>
                  <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
                  <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                  <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                  <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
              </td>
              <td style="text-align: right;">
                <a href="/orders/${o.orderNumber}" class="btn btn-secondary btn-sm">Timeline</a>
                <a href="/orders/${o.orderNumber}?format=json" target="_blank" class="btn btn-secondary btn-sm">JSON</a>
              </td>
            </tr>`;
          }).join('');

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>📦 Orders & Fulfillment Component</h2>
            <p>Live Courier Logistics, Tracking & Order Processing Pipeline (<code>zaraz_db</code>)</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span class="badge-api">GET /orders</span>
            <button onclick="createSampleOrder()" class="btn btn-emerald btn-sm">+ Create Sample Order</button>
          </div>
        </div>

        <!-- Filter by email bar -->
        <div class="card" style="margin-bottom: 2rem; padding: 1rem 1.25rem;">
          <form method="GET" action="/orders" style="display: flex; gap: 0.75rem; align-items: center;">
            <input type="email" name="email" value="${email || ''}" placeholder="Filter orders by customer email (e.g. user@zaraz.com)..." class="form-control" style="flex: 1;" />
            <button type="submit" class="btn btn-emerald btn-sm">Filter Orders</button>
            ${email ? '<a href="/orders" class="btn btn-secondary btn-sm">Clear</a>' : ''}
          </form>
        </div>

        <!-- Orders Table Card Component -->
        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th>Order Number</th>
                <th>Customer Info</th>
                <th>Ordered Items</th>
                <th>Total BDT</th>
                <th>Payment Channel</th>
                <th>Fulfillment Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `;

      const extraScripts = `
        <script>
          async function handleUpdateStatus(orderId, newStatus) {
            try {
              const res = await fetch('/orders/' + orderId + '/status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, note: 'Status manually updated via Zaraz Component UI' })
              });
              const data = await res.json();
              if (data.success) {
                showToast('Order status updated to ' + newStatus);
              } else {
                showToast(data.message || 'Status update failed', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }

          async function createSampleOrder() {
            const sample = {
              customer: {
                name: 'Tanzim Ahmed',
                email: 'tanzim@example.com',
                phone: '01799887766',
                address: 'Road 11, Banani, Block D',
                city: 'Dhaka',
                deliveryType: 'home'
              },
              items: [
                {
                  productId: 'p_demo_' + Date.now(),
                  title: 'Sony WH-1000XM5 Wireless Headphones',
                  price: 36500,
                  quantity: 1,
                  brand: 'Sony'
                }
              ],
              delivery: { method: 'express', fee: 120 },
              payment: { method: 'bkash', status: 'Settled' },
              pricing: { subtotal: 36500, shippingFee: 120, discount: 0, total: 36620 }
            };

            try {
              const res = await fetch('/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sample)
              });
              const data = await res.json();
              if (data.success) {
                showToast('Sample order ' + data.order.orderNumber + ' created!');
                setTimeout(() => window.location.reload(), 800);
              } else {
                showToast(data.message || 'Creation failed', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        </script>
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Orders Component',
        activeNav: 'orders',
        content: htmlContent,
        jsonUrl: `/orders?format=json${email ? `&email=${encodeURIComponent(email)}` : ''}`,
        extraScripts,
      }));
    }

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
      const wantsHtml = isHtmlRequest(req);

      if (wantsHtml) {
        return res.status(404).send(renderBaseLayout({
          title: 'Order Not Found',
          activeNav: 'orders',
          content: `
            <div class="card" style="text-align: center; padding: 4rem 2rem;">
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #f87171; margin-bottom: 0.5rem;">404 - Order Not Found</h2>
              <p style="color: var(--muted); margin-bottom: 2rem;">No order matched identifier: <code>${id}</code></p>
              <a href="/orders" class="btn btn-emerald">Back to Orders</a>
            </div>
          `,
          jsonUrl: `/orders/${id}?format=json`,
        }));
      }

      return res.status(404).json({
        success: false,
        message: `Order not found with identifier: ${id}`,
      });
    }

    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const timelineHtml = (order.timeline || []).map((step, idx) => {
        const isDone = step.completed;
        return `
        <div style="display: flex; gap: 1rem; position: relative;">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isDone ? '#10b981' : '#1e293b'}; color: ${isDone ? '#04170f' : '#94a3b8'}; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 800; border: 2px solid ${isDone ? '#34d399' : '#334155'}; z-index: 2;">
              ${isDone ? '✓' : idx + 1}
            </div>
            ${idx < (order.timeline.length - 1) ? `<div style="width: 2px; flex: 1; background: ${isDone ? '#059669' : '#1e293b'}; min-height: 40px;"></div>` : ''}
          </div>
          <div style="padding-bottom: 1.5rem;">
            <div style="font-weight: 700; color: ${isDone ? '#fff' : '#94a3b8'}; font-size: 0.95rem;">${step.title}</div>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 0.2rem;">${step.description || ''}</div>
            <div style="font-size: 0.72rem; color: ${isDone ? '#34d399' : '#475569'}; margin-top: 0.25rem;">${step.date || ''} ${step.time ? `&bull; ${step.time}` : ''}</div>
          </div>
        </div>`;
      }).join('');

      const itemsHtml = (order.items || []).map((item) => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
          <div>
            <div style="font-weight: 700; color: #fff; font-size: 0.9rem;">${item.title}</div>
            <div style="font-size: 0.75rem; color: var(--muted);">Qty: ${item.quantity} &bull; Brand: ${item.brand || 'Zaraz'}</div>
          </div>
          <div style="font-weight: 700; color: var(--emerald-light);">৳${(item.price * item.quantity).toLocaleString()}</div>
        </div>
      `).join('');

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>🚚 Order Tracking Component</h2>
            <p>Order Number: <strong style="color: #fff; font-family: 'JetBrains Mono', monospace;">${order.orderNumber}</strong></p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <a href="/orders" class="btn btn-secondary btn-sm">&larr; All Orders</a>
            <a href="/orders/${order.orderNumber}?format=json" target="_blank" class="btn btn-secondary btn-sm">Raw JSON</a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; margin-bottom: 2.5rem;">
          <!-- Timeline Component -->
          <div class="card">
            <h3 style="font-size: 1.15rem; font-weight: 800; color: #fff; margin-bottom: 1.5rem;">
              Fulfillment & Courier Progress
            </h3>
            <div>
              ${timelineHtml}
            </div>
          </div>

          <!-- Order Summary & Customer Details -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            <!-- Customer Card -->
            <div class="card">
              <h4 style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem;">
                Delivery Destination
              </h4>
              <div style="font-weight: 700; color: #fff; font-size: 1.05rem;">${order.customer?.name}</div>
              <div style="font-size: 0.85rem; color: #cbd5e1; margin-top: 0.25rem;">${order.customer?.address}, ${order.customer?.city}</div>
              <div style="font-size: 0.8rem; color: var(--emerald-light); margin-top: 0.35rem;">📞 ${order.customer?.phone} &bull; ✉️ ${order.customer?.email}</div>
            </div>

            <!-- Receipt Card -->
            <div class="card">
              <h4 style="font-size: 0.8rem; font-weight: 700; text-transform: uppercase; color: var(--muted); margin-bottom: 1rem;">
                Items & Invoice Breakdown
              </h4>
              <div style="margin-bottom: 1rem;">
                ${itemsHtml}
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.35rem;">
                <span>Subtotal</span>
                <span>৳${order.pricing?.subtotal?.toLocaleString()}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem;">
                <span>Delivery Fee (${order.delivery?.method || 'standard'})</span>
                <span>৳${order.pricing?.shippingFee || 60}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.15rem; font-weight: 800; color: var(--emerald-light); padding-top: 0.75rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                <span>Total Paid</span>
                <span>৳${order.pricing?.total?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      `;

      return res.status(200).send(renderBaseLayout({
        title: `Order ${order.orderNumber}`,
        activeNav: 'orders',
        content: htmlContent,
        jsonUrl: `/orders/${order.orderNumber}?format=json`,
      }));
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
        message: 'Order not found',
      });
    }

    order.status = status;

    // Advance timeline based on status
    const statusOrder = ['Order Placed', 'Payment Verified', 'Processing', 'Shipped', 'Delivered'];
    const currentIdx = statusOrder.indexOf(status);

    if (currentIdx !== -1 && order.timeline) {
      order.timeline.forEach((step, idx) => {
        if (idx <= currentIdx) {
          step.completed = true;
          if (!step.date || step.date === 'Next step' || step.date === 'Upcoming') {
            step.date = new Date().toLocaleDateString();
            step.time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
        }
      });
    }

    if (note && order.timeline && order.timeline[currentIdx]) {
      order.timeline[currentIdx].description = note;
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
