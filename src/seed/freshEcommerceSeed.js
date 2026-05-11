import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { conf } from "../conf/conf.js";
import Cart from "../models/cart/cart.schema.js";
import Category from "../models/categories/category.schema.js";
import FeatureBanner from "../models/featuredBanner/featureBanner.schema.js";
import Invoice from "../models/invoices/invoices.schema.js";
import Order from "../models/orders/order.schema.js";
import Product from "../models/products/product.schema.js";
import { RecentActivitySchema } from "../models/recentActivity/recentActivity.schema.js";
import Review from "../models/reviews/review.schema.js";
import { AuthSessionSchema, OtpSessionSchema, SessionSchema } from "../models/sessions/session.schema.js";
import UserBehaviour from "../models/userHistory/userHistorySchema.js";
import User from "../models/users/user.schema.js";
import WishList from "../models/wishList/wishList.schema.js";

const confirmed = process.argv.includes("--confirm");

if (!confirmed) {
  console.error("This seed deletes ecommerce data. Run with --confirm to continue.");
  process.exit(1);
}

if (!conf.mongoUrl || !conf.dbName) {
  console.error("MONGO_URL and DB_NAME are required in .env.");
  process.exit(1);
}

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 70);

const hashString = (value) =>
  String(value)
    .split("")
    .reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0)
    .toString(36)
    .slice(0, 6);

const aiImage = (prompt, width = 1200, height = 900) =>
  `/seed-images/${slugify(prompt)}-${hashString(`${prompt}-${width}-${height}`)}-${width}x${height}.svg`;

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);
const daysAgo = (days) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

const categoriesSeed = [
  {
    categoryName: "Smart Tech",
    displaytitle: "Daily devices with a premium edge",
    categoryImage: aiImage("sleek smart watch wireless earbuds and compact charging dock arranged on warm stone"),
    featureImageUrl: aiImage("modern desk setup with wearable tech headphones and smart home controls", 1400, 800),
  },
  {
    categoryName: "Home Living",
    displaytitle: "Functional pieces for calmer spaces",
    categoryImage: aiImage("minimal home shelf with ceramic diffuser linen lamp and storage accessories"),
    featureImageUrl: aiImage("premium home living collection on bright interior table", 1400, 800),
  },
  {
    categoryName: "Style Essentials",
    displaytitle: "Wardrobe staples and refined carry goods",
    categoryImage: aiImage("premium leather backpack sunglasses watch and folded apparel flat lay"),
    featureImageUrl: aiImage("editorial fashion accessories ecommerce arrangement", 1400, 800),
  },
  {
    categoryName: "Wellness",
    displaytitle: "Recovery, hydration, and everyday care",
    categoryImage: aiImage("wellness products yoga mat insulated bottle skincare and recovery band"),
    featureImageUrl: aiImage("bright wellness ecommerce product display with natural materials", 1400, 800),
  },
];

const productSeeds = [
  ["Smart Tech", "AeroPulse Noise Cancelling Headphones", 189.95, 42, "Wireless over-ear headphones with adaptive noise cancelling, plush memory-foam cushions, thirty-hour battery life, and fast USB-C charging for travel, work, and study.", "matte black wireless noise cancelling headphones on warm beige studio background"],
  ["Smart Tech", "LumaFit AMOLED Smartwatch", 229.0, 28, "A slim AMOLED smartwatch with health tracking, GPS workouts, sleep insights, stainless side buttons, and a comfortable woven sport band.", "premium AMOLED smartwatch with woven strap on stone plinth"],
  ["Smart Tech", "VoltNest 3-in-1 Charging Stand", 74.5, 64, "A weighted magnetic charging stand for phone, earbuds, and watch with tidy cable routing and a soft-touch finish.", "3 in 1 wireless charging stand holding phone earbuds and watch in clean studio"],
  ["Smart Tech", "PocketBeam Mini Projector", 319.0, 16, "A compact HD projector with auto keystone, built-in speaker, and portable battery support for movie nights and presentations.", "small premium portable projector projecting soft light on neutral wall"],
  ["Home Living", "CedarMist Ceramic Diffuser", 59.95, 51, "A quiet ultrasonic diffuser in glazed ceramic with warm ambient lighting and timed mist modes for bedrooms and living rooms.", "ceramic essential oil diffuser with soft mist on oak table"],
  ["Home Living", "HaloGlow Bedside Lamp", 88.0, 35, "A dimmable lamp with touch controls, linen shade, warm LEDs, and a compact footprint for bedside reading.", "modern bedside lamp with linen shade glowing warmly on nightstand"],
  ["Home Living", "Nord Pantry Storage Set", 46.75, 73, "A six-piece stackable pantry storage kit with airtight bamboo lids and clear bodies for fast kitchen organization.", "clear pantry storage containers with bamboo lids arranged neatly"],
  ["Home Living", "CloudWeave Throw Blanket", 69.0, 24, "A heavyweight woven throw with a soft brushed finish, made for sofas, reading corners, and layered bedroom styling.", "soft woven throw blanket folded on modern sofa close product shot"],
  ["Style Essentials", "Atlas Weekender Backpack", 129.0, 31, "A structured water-resistant backpack with padded laptop storage, luggage sleeve, and separate shoe pocket for short trips.", "premium charcoal travel backpack standing upright with leather details"],
  ["Style Essentials", "Solace Polarized Sunglasses", 84.0, 47, "Lightweight polarized sunglasses with a refined square frame, scratch-resistant lenses, and a protective travel case.", "black polarized sunglasses on warm stone with premium case"],
  ["Style Essentials", "Meridian Leather Wallet", 58.0, 66, "A slim full-grain leather wallet with RFID lining, quick-access card slots, and a clean stitched profile.", "brown leather slim wallet open with cards on studio surface"],
  ["Style Essentials", "Harbor Knit Overshirt", 96.0, 22, "A soft structured knit overshirt with horn-style buttons, relaxed shoulders, and a polished everyday fit.", "premium folded knit overshirt with buttons ecommerce flat lay"],
  ["Wellness", "HydraLoop Insulated Bottle", 39.95, 88, "A double-wall insulated bottle with ceramic-lined interior, leakproof cap, and carry loop for gym, office, and travel.", "matte insulated water bottle with carry loop on bright wellness set"],
  ["Wellness", "FlexForm Yoga Mat", 72.0, 38, "A dense non-slip yoga mat with alignment markings, excellent grip, and a carry strap for studio or home practice.", "premium yoga mat rolled partly open with alignment lines"],
  ["Wellness", "PulseRoll Recovery Massager", 119.0, 19, "A compact recovery massager with four speed levels, quiet motor, and interchangeable heads for post-workout relief.", "compact massage gun with attachments arranged in premium case"],
  ["Wellness", "GlowLab Daily Skincare Kit", 64.0, 44, "A balanced skincare trio with cleanser, moisturizer, and mineral SPF in clean refillable packaging.", "minimal skincare bottles and jars arranged on clean bathroom counter"],
];

const usersSeed = [
  ["Ram", "Admin", 410000001, "admin@nepastore.test", "admin", "https://api.dicebear.com/8.x/initials/svg?seed=Admin", "42 Market Street, Sydney NSW 2000, Australia"],
  ["Maya", "Shrestha", 410000002, "maya@nepastore.test", "customer", "https://api.dicebear.com/8.x/initials/svg?seed=Maya", "18 King Street, Newtown NSW 2042, Australia"],
  ["Oliver", "Chen", 410000003, "oliver@nepastore.test", "customer", "https://api.dicebear.com/8.x/initials/svg?seed=Oliver", "7 Harbour Road, Melbourne VIC 3000, Australia"],
  ["Ava", "Williams", 410000004, "ava@nepastore.test", "customer", "https://api.dicebear.com/8.x/initials/svg?seed=Ava", "25 Leaf Lane, Brisbane QLD 4000, Australia"],
  ["Noah", "Patel", 410000005, "noah@nepastore.test", "customer", "https://api.dicebear.com/8.x/initials/svg?seed=Noah", "9 Station Road, Adelaide SA 5000, Australia"],
];

const reviewCopy = [
  "The build quality feels genuinely premium and the packaging looked excellent.",
  "Exactly what I hoped for. Delivery was quick and the product matched the photos.",
  "Clean design, easy to use, and it feels much more expensive than it is.",
  "I have used it every day this week. Very happy with the value.",
  "Beautiful finish and reliable performance. I would buy this again.",
  "The details are thoughtful and it fits perfectly into my routine.",
];

const clearCollections = async () => {
  await Promise.all([
    Cart.deleteMany({}),
    Category.deleteMany({}),
    FeatureBanner.deleteMany({}),
    Invoice.deleteMany({}),
    Order.deleteMany({}),
    Product.deleteMany({}),
    RecentActivitySchema.deleteMany({}),
    Review.deleteMany({}),
    SessionSchema.deleteMany({}),
    AuthSessionSchema.deleteMany({}),
    OtpSessionSchema.deleteMany({}),
    UserBehaviour.deleteMany({}),
    User.deleteMany({}),
    WishList.deleteMany({}),
  ]);
};

const seed = async () => {
  await mongoose.connect(conf.mongoUrl, { dbName: conf.dbName });
  console.log(`Connected to ${conf.dbName}`);

  await clearCollections();
  console.log("Cleared existing ecommerce data.");

  const password = await bcrypt.hash("Password123!", 10);
  const users = await User.insertMany(
    usersSeed.map(([fName, lName, phone, email, role, image, address]) => ({
      fName,
      lName,
      phone,
      email,
      role,
      image,
      address,
      password,
      confirmPassword: password,
      verified: true,
    }))
  );

  const admin = users.find((user) => user.role === "admin");
  const customers = users.filter((user) => user.role === "customer");

  const categories = await Category.insertMany(categoriesSeed);
  const categoryByName = new Map(categories.map((category) => [category.categoryName, category]));

  const products = await Product.insertMany(
    productSeeds.map(([categoryName, name, price, stock, description, imagePrompt], index) => ({
      status: "active",
      name,
      description,
      price,
      stock,
      category: categoryByName.get(categoryName)._id,
      images: [
        aiImage(`${imagePrompt}, ecommerce catalog hero image`, 1200, 900),
        aiImage(`${imagePrompt}, alternate angle close up`, 1200, 900),
      ],
      ratings: 0,
      createdAt: daysAgo(18 - index),
      updatedAt: daysAgo(1),
    }))
  );

  const reviews = [];
  for (const [productIndex, product] of products.entries()) {
    const reviewCount = productIndex % 3 === 0 ? 4 : 3;
    for (let i = 0; i < reviewCount; i += 1) {
      const user = customers[(productIndex + i) % customers.length];
      reviews.push({
        productId: product._id,
        productName: product.name,
        productImage: product.images[0],
        userId: user._id,
        email: user.email,
        userName: `${user.fName} ${user.lName}`,
        userImage: user.image,
        rating: 4 + ((productIndex + i) % 2),
        comment: reviewCopy[(productIndex + i) % reviewCopy.length],
        approved: true,
        createdAt: daysAgo(12 - (i % 5)),
        updatedAt: daysAgo(1),
      });
    }
  }

  const savedReviews = await Review.insertMany(reviews);

  for (const product of products) {
    const productReviews = savedReviews.filter((review) => String(review.productId) === String(product._id));
    const rating =
      productReviews.reduce((total, review) => total + review.rating, 0) / productReviews.length;

    await Product.findByIdAndUpdate(product._id, {
      reviews: productReviews.map((review) => review._id),
      ratings: Number(rating.toFixed(1)),
    });
  }

  const banners = await FeatureBanner.insertMany([
    {
      title: "New Season Essentials",
      featureBannerImgUrl: aiImage("premium ecommerce hero banner showing smart tech home goods style accessories and wellness products", 1600, 700),
      products: products.slice(0, 6).map((product) => product._id),
      promoType: "New",
      expiresAt: daysFromNow(30),
      createdAt: new Date(),
      status: "active",
    },
    {
      title: "Wellness Reset",
      featureBannerImgUrl: aiImage("bright wellness ecommerce banner with yoga mat bottle skincare and recovery tools", 1600, 700),
      products: products.slice(12, 16).map((product) => product._id),
      promoType: "seasonal",
      expiresAt: daysFromNow(45),
      createdAt: new Date(),
      status: "active",
    },
    {
      title: "Travel Ready Picks",
      featureBannerImgUrl: aiImage("premium travel accessories ecommerce banner backpack headphones sunglasses and bottle", 1600, 700),
      products: [products[0], products[8], products[9], products[12]].map((product) => product._id),
      promoType: "discounted",
      expiresAt: daysFromNow(21),
      createdAt: new Date(),
      status: "active",
    },
  ]);

  const orderTemplates = [
    { user: customers[0], indexes: [0, 4, 12], status: "delivered", date: daysAgo(8) },
    { user: customers[1], indexes: [8, 9], status: "shipped", date: daysAgo(5) },
    { user: customers[2], indexes: [1, 13, 15], status: "confirmed", date: daysAgo(2) },
    { user: customers[3], indexes: [6, 10], status: "inTransit", date: daysAgo(1) },
  ];

  const orders = await Order.insertMany(
    orderTemplates.map((template, orderIndex) => {
      const orderProducts = template.indexes.map((productIndex, itemIndex) => {
        const product = products[productIndex];
        const quantity = itemIndex === 0 ? 1 : 2;
        return {
          _id: product._id,
          name: product.name,
          quantity,
          price: product.price,
          totalAmount: product.price * quantity,
          images: product.images,
        };
      });
      const totalAmount = orderProducts.reduce((sum, item) => sum + item.totalAmount, 0);

      return {
        userId: template.user._id,
        products: orderProducts,
        status: template.status,
        status_history: [
          { status: "pending", date: template.date, description: "Order placed." },
          { status: template.status, date: daysFromNow(orderIndex - 3), description: `Order is "${template.status}"` },
        ],
        courier: "Australia Post",
        tracking_number: `NP${Date.now().toString().slice(-6)}${orderIndex}`,
        totalAmount,
        shippingAddress: template.user.address,
        expectedDeliveryDate: daysFromNow(5 + orderIndex),
        createdAt: template.date,
        updatedAt: new Date(),
      };
    })
  );

  await Invoice.insertMany(
    orders.map((order, index) => ({
      invoiceNumber: `INV-DEMO-${String(index + 1).padStart(4, "0")}`,
      orderId: String(order._id),
      userId: String(order.userId),
      userName: `${customers[index % customers.length].fName} ${customers[index % customers.length].lName}`,
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      taxAmount: 0,
      status: "paid",
      products: order.products.map((product) => ({
        id: String(product._id),
        name: product.name,
        quantity: product.quantity,
        amount_total: product.totalAmount,
        productImages: product.images,
      })),
      notes: "Demo invoice generated by fresh ecommerce seed.",
    }))
  );

  await Cart.insertMany([
    {
      userId: customers[0]._id,
      cartItems: [products[2], products[5]].map((product) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        totalAmount: product.price,
        images: product.images,
        stock: product.stock,
        quantity: 1,
      })),
    },
  ]);

  await WishList.insertMany(
    [products[0], products[3], products[8], products[14]].map((product, index) => ({
      userId: String(customers[index % customers.length]._id),
      productId: String(product._id),
      name: product.name,
      unitPrice: product.price,
      stockStatus: String(product.stock),
      image: product.images[0],
    }))
  );

  await UserBehaviour.insertMany(
    customers.map((user, index) => ({
      userId: user._id,
      history: [
        { productId: products[index]._id, categoryId: products[index].category, action: "view" },
        { productId: products[index + 4]._id, categoryId: products[index + 4].category, action: "add_to_cart" },
        { productId: products[index + 8]._id, categoryId: products[index + 8].category, action: "purchase" },
      ],
    }))
  );

  await RecentActivitySchema.insertMany([
    {
      userDetail: { userId: admin._id, userName: `${admin.fName} ${admin.lName}` },
      action: "categoryCreated",
      entityId: String(categories[0]._id),
      entityType: "category",
    },
    {
      userDetail: { userId: admin._id, userName: `${admin.fName} ${admin.lName}` },
      action: "productAdded",
      entityId: String(products[0]._id),
      entityType: "product",
    },
    {
      userDetail: { userId: admin._id, userName: `${admin.fName} ${admin.lName}` },
      action: "bannerCreated",
      entityId: String(banners[0]._id),
      entityType: "banner",
    },
    {
      userDetail: { userId: customers[0]._id, userName: `${customers[0].fName} ${customers[0].lName}` },
      action: "orderPlaced",
      entityId: String(orders[0]._id),
      entityType: "order",
    },
    {
      userDetail: { userId: customers[1]._id, userName: `${customers[1].fName} ${customers[1].lName}` },
      action: "productReviewed",
      entityId: String(products[1]._id),
      entityType: "review",
    },
  ]);

  console.log("Fresh ecommerce seed completed.");
  console.log("Admin login: admin@nepastore.test / Password123!");
  console.log("Customer login: maya@nepastore.test / Password123!");
};

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
