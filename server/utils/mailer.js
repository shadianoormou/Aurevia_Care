import nodemailer from "nodemailer";

let transporter;

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const getTransporter = () => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  return transporter;
};

const statusCopy = {
  Confirmed: "Your order has been confirmed and is now being prepared.",
  Processing: "Your order is being prepared by our pharmacy team.",
  Shipped: "Your order has left our pharmacy and is on its way.",
  Delivered: "Your order has been marked as delivered. Thank you for choosing Aurevia Care.",
  Cancelled: "Your order has been cancelled. Any eligible refund will follow the selected payment policy.",
};

export const sendOrderStatusEmail = async (order, status) => {
  const recipient = order?.user?.email;
  if (!recipient) return { sent: false, reason: "no_email" };
  const mailer = getTransporter();
  if (!mailer) {
    console.warn("Order email skipped: SMTP is not configured");
    return { sent: false, reason: "smtp_not_configured" };
  }

  const orderId = String(order._id).slice(0, 8).toUpperCase();
  const subject = `Aurevia Care order #${orderId} is ${status}`;
  const message = statusCopy[status] || `Your order status is now ${status}.`;
  const itemRows = (order.items || []).map((item) => `
    <tr><td style="padding:8px 0;border-bottom:1px solid #e5eee9">${escapeHtml(item.name)}</td>
    <td style="padding:8px 0;border-bottom:1px solid #e5eee9;text-align:right">× ${item.quantity}</td></tr>`).join("");

  await mailer.sendMail({
    from: process.env.SMTP_FROM || `Aurevia Care <${process.env.SMTP_USER}>`,
    to: recipient,
    subject,
    text: `Hello ${order.user?.name || "there"},\n\n${message}\n\nOrder #${orderId}\nTotal: ${order.totalPrice}\n\nAurevia Care`,
    html: `<!doctype html><html><body style="margin:0;background:#f2f6f4;font-family:Arial,sans-serif;color:#123f3b">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:20px;padding:32px;border:1px solid #d2eee5">
        <p style="font-size:11px;letter-spacing:2px;color:#8d6422;font-weight:700">AUREVIA CARE · ORDER UPDATE</p>
        <h1 style="font-size:28px;margin:12px 0;color:#0a2828">Order ${escapeHtml(status)}</h1>
        <p style="line-height:1.6;color:#526d68">Hello ${escapeHtml(order.user?.name || "there")}, ${escapeHtml(message)}</p>
        <div style="background:#edf8f5;border-radius:14px;padding:16px;margin:24px 0"><b>Order #${orderId}</b><span style="float:right;font-weight:700">${order.totalPrice}</span></div>
        <table style="width:100%;border-collapse:collapse">${itemRows}</table>
        <p style="font-size:12px;color:#78908b;margin-top:28px">This is an automated update from Aurevia Care. Please contact support if you need help.</p>
      </div></body></html>`,
  });
  return { sent: true, reason: "sent" };
};
