const companyName = () => process.env.COMPANY_NAME || "NepaStore";
const fromEmail = () => process.env.SMTP_FROM || process.env.SMTP_EMAIL || "";
const supportEmail = () =>
  process.env.CONTACT_EMAIL ||
  process.env.SUPPORT_EMAIL ||
  process.env.SMTP_FROM ||
  process.env.SMTP_EMAIL ||
  "";

const formatMoney = (value = 0) => `$${Number(value || 0).toFixed(2)}`;

const statusLabel = (status = "") =>
  String(status || "updated")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

const emailShell = ({ title, preview, body }) => `
  <div style="margin:0;padding:0;background:#f4eee7;font-family:Arial,Helvetica,sans-serif;color:#211915;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preview || ""}</div>
    <div style="max-width:680px;margin:0 auto;padding:30px 14px;">
      <div style="background:#171411;color:#fff8ef;border-radius:24px 24px 0 0;padding:28px 30px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d7a740;font-weight:800;">${companyName()}</div>
        <h1 style="margin:10px 0 0;font-size:30px;line-height:1.15;">${title}</h1>
      </div>
      <div style="background:#fffaf4;border:1px solid #e6ddcf;border-top:0;border-radius:0 0 24px 24px;padding:30px;box-shadow:0 20px 45px rgba(40,27,15,.12);">
        ${body}
        <div style="margin-top:30px;padding-top:18px;border-top:1px solid #eadfce;color:#74675e;font-size:13px;line-height:1.55;">
          <p style="margin:0;">Need help? Contact us at <a href="mailto:${supportEmail()}" style="color:#8b4d24;font-weight:800;">${supportEmail()}</a>.</p>
          <p style="margin:8px 0 0;">Regards,<br/><strong>${companyName()}</strong></p>
        </div>
      </div>
    </div>
  </div>
`;

const ctaButton = (url, label) => `
  <a href="${url}" style="display:inline-block;background:#171411;color:#fff8ef;text-decoration:none;border-radius:999px;padding:13px 22px;font-weight:800;margin-top:12px;">
    ${label}
  </a>
`;

const infoPill = (label, value) => `
  <div style="background:#f6efe7;border:1px solid #eadfce;border-radius:16px;padding:14px 16px;">
    <div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:#887768;font-weight:800;">${label}</div>
    <div style="margin-top:6px;font-size:17px;font-weight:800;color:#211915;">${value}</div>
  </div>
`;

const productRows = (products = []) =>
  products
    .map((item) => {
      const image = item.images?.[0] || item.productImages?.[0] || "";
      const total = item.totalAmount ?? item.amount_total ?? item.price;

      return `
        <tr>
          <td style="padding:13px 10px;border-bottom:1px solid #eadfce;width:64px;">
            ${
              image
                ? `<img src="${image}" alt="${item.name || "Product"}" style="width:52px;height:52px;object-fit:cover;border-radius:13px;border:1px solid #eadfce;" />`
                : `<div style="width:52px;height:52px;border-radius:13px;background:#f1e5d6;border:1px solid #eadfce;"></div>`
            }
          </td>
          <td style="padding:13px 10px;border-bottom:1px solid #eadfce;font-weight:800;">${item.name || "Product"}</td>
          <td style="padding:13px 10px;border-bottom:1px solid #eadfce;text-align:center;">${item.quantity || 1}</td>
          <td style="padding:13px 10px;border-bottom:1px solid #eadfce;text-align:right;font-weight:800;">${formatMoney(total)}</td>
        </tr>
      `;
    })
    .join("");

const productTable = (products = []) => `
  <table style="width:100%;border-collapse:collapse;margin-top:18px;background:#fff;border:1px solid #eadfce;border-radius:18px;overflow:hidden;">
    <thead>
      <tr style="background:#241d18;color:#fff8ef;">
        <th style="text-align:left;padding:12px 10px;">Image</th>
        <th style="text-align:left;padding:12px 10px;">Product</th>
        <th style="text-align:center;padding:12px 10px;">Qty</th>
        <th style="text-align:right;padding:12px 10px;">Price</th>
      </tr>
    </thead>
    <tbody>${productRows(products)}</tbody>
  </table>
`;

const orderSummary = (order = {}) => `
  <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0;">
    ${infoPill("Order", `#${order._id || "N/A"}`)}
    ${infoPill("Total", formatMoney(order.totalAmount))}
    ${infoPill("Status", statusLabel(order.status))}
    ${infoPill(
      "Delivery",
      order?.expectedDeliveryDate
        ? new Date(order.expectedDeliveryDate).toISOString().split("T")[0]
        : "Track from your account"
    )}
  </div>
`;

export const userActivatedEmailTempalate = ({ email, userName, url }) => ({
  from: `${companyName()} <${fromEmail()}>`,
  to: email,
  subject: "Activate your account",
  text: `Hi ${userName}, activate your account here: ${url}`,
  html: emailShell({
    title: "Activate your account",
    preview: "Your account is ready. Activate it to start shopping.",
    body: `
      <p style="font-size:16px;line-height:1.65;margin:0;">Hi <strong>${userName}</strong>, your account has been created successfully.</p>
      <p style="font-size:16px;line-height:1.65;margin:12px 0 0;">Confirm your email address to unlock your account and continue shopping.</p>
      ${ctaButton(url, "Activate account")}
    `,
  }),
});

export const OTPemailTemplate = ({ OTP, userName, email }) => ({
  from: `${companyName()} <${fromEmail()}>`,
  to: email,
  subject: "Your verification code",
  text: `Your verification code is ${OTP}`,
  html: emailShell({
    title: "Your verification code",
    preview: `Your code is ${OTP}`,
    body: `
      <p style="font-size:16px;line-height:1.65;margin:0;">Hi <strong>${userName || "there"}</strong>, use this code to continue.</p>
      <div style="margin:22px 0;background:#171411;color:#fff8ef;border-radius:20px;padding:22px;text-align:center;font-size:34px;letter-spacing:8px;font-weight:900;">${OTP}</div>
      <p style="font-size:14px;line-height:1.55;color:#74675e;margin:0;">If you did not request this code, you can safely ignore this email.</p>
    `,
  }),
});

export const orderCreated = ({ userName, email, order, attachments = [] }) => ({
  from: `${companyName()} <${fromEmail()}>`,
  to: email,
  subject: `Order placed successfully - #${order?._id}`,
  text: `Hi ${userName}, your order #${order?._id} has been placed successfully.`,
  html: emailShell({
    title: "Your order is confirmed",
    preview: `Order #${order?._id} has been placed successfully.`,
    body: `
      <p style="font-size:16px;line-height:1.65;margin:0;">Hi <strong>${userName}</strong>, thank you for your purchase. We received your order and it is now being prepared.</p>
      ${orderSummary(order)}
      ${productTable(order?.products || [])}
    `,
  }),
  attachments,
});

export const orderUpdate = ({ userName, email, order }) => ({
  from: `${companyName()} <${fromEmail()}>`,
  to: email,
  subject: `Order ${statusLabel(order?.status)} - #${order?._id}`,
  text: `Hi ${userName}, your order #${order?._id} is now ${statusLabel(order?.status)}.`,
  html: emailShell({
    title: `Order ${statusLabel(order?.status)}`,
    preview: `Your order #${order?._id} is now ${statusLabel(order?.status)}.`,
    body: `
      <p style="font-size:16px;line-height:1.65;margin:0;">Hi <strong>${userName}</strong>, your order status has been updated.</p>
      ${orderSummary(order)}
      ${
        order?.trackingLink
          ? `<p style="margin:0 0 16px;">Track your package here: <a href="${order.trackingLink}" style="color:#8b4d24;font-weight:800;">Open tracking</a></p>`
          : ""
      }
      ${productTable(order?.products || [])}
    `,
  }),
});

export const inquiryForm = ({
  customer_name,
  customer_email,
  customer_message,
  orderNumber,
}) => ({
  subject: orderNumber ? `Order inquiry - #${orderNumber}` : "Customer inquiry",
  text: `
Customer inquiry

${orderNumber ? `Order number: ${orderNumber}\n` : ""}Name: ${customer_name}
Email: ${customer_email}

Message:
${customer_message}
`,
  html: emailShell({
    title: "New customer message",
    preview: `${customer_name} sent a message from the store.`,
    body: `
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-bottom:18px;">
        ${infoPill("Customer", customer_name || "N/A")}
        ${infoPill("Email", customer_email || "N/A")}
        ${orderNumber ? infoPill("Order", `#${orderNumber}`) : ""}
      </div>
      <div style="background:#f6efe7;border:1px solid #eadfce;border-radius:18px;padding:18px;white-space:pre-wrap;line-height:1.65;">${customer_message || ""}</div>
    `,
  }),
});

export const inquiryConfirmation = ({
  customer_name,
  customer_message,
  orderNumber,
}) => ({
  subject: `We received your message - ${companyName()}`,
  text: `
Hi ${customer_name},

Thanks for contacting ${companyName()}. We received your message and will get back to you soon.

${orderNumber ? `Order number: ${orderNumber}\n` : ""}Your message:
${customer_message}
`,
  html: emailShell({
    title: "We received your message",
    preview: "Thanks for contacting us. We will get back to you soon.",
    body: `
      <p style="font-size:16px;line-height:1.65;margin:0;">Hi <strong>${customer_name}</strong>, thanks for reaching out. We received your message and will get back to you soon.</p>
      ${orderNumber ? `<p style="margin:16px 0 0;"><strong>Order:</strong> #${orderNumber}</p>` : ""}
      <div style="margin-top:18px;background:#f6efe7;border:1px solid #eadfce;border-radius:18px;padding:18px;white-space:pre-wrap;line-height:1.65;">${customer_message || ""}</div>
    `,
  }),
});
