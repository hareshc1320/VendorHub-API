import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const hashed = await bcrypt.hash("admin123", 10);
  const user = await prisma.user.upsert({
    where: { email: "admin@vendorhub.io" },
    update: {},
    create: {
      email:      "admin@vendorhub.io",
      password:   hashed,
      full_name:  "Admin User",
      store_name: "VendorHub Store",
      bio:        "Managing the VendorHub multi-vendor marketplace.",
    },
  });
  console.log(`✓ User: ${user.email} (password: admin123)`);

  // Products
  const productsData = [
    { name: "Wireless Noise-Cancelling Headphones", price: 299.99, stock: 42, category: "Audio",       description: "Premium audio with ANC" },
    { name: "Smart Fitness Tracker Pro",            price: 149.99, stock: 8,  category: "Wearables",   description: "Track your health goals" },
    { name: "USB-C Hub 10-in-1",                   price: 79.99,  stock: 0,  category: "Accessories", description: "Expand your connectivity" },
    { name: "Mechanical Keyboard RGB",             price: 189.99, stock: 23, category: "Peripherals", description: "Tactile typing experience" },
    { name: "4K Webcam Pro",                       price: 129.99, stock: 5,  category: "Cameras",     description: "Crystal clear video calls" },
    { name: "Portable SSD 1TB",                    price: 99.99,  stock: 67, category: "Storage",     description: "Fast and compact storage" },
    { name: "Wireless Charging Pad",               price: 49.99,  stock: 0,  category: "Accessories", description: "Qi-certified fast charging" },
    { name: "True Wireless Earbuds",               price: 199.99, stock: 31, category: "Audio",       description: "12h battery + ANC" },
    { name: "Smart Watch Series X",                price: 399.99, stock: 14, category: "Wearables",   description: "Premium health tracking" },
    { name: "Gaming Mouse Pro",                    price: 89.99,  stock: 55, category: "Peripherals", description: "16000 DPI precision" },
  ];

  await prisma.product.deleteMany({ where: { owner_id: user.id } });
  await prisma.product.createMany({
    data: productsData.map((p) => ({ ...p, owner_id: user.id })),
  });
  console.log(`✓ ${productsData.length} products seeded`);

  // Customers
  const customersData = [
    { name: "Aarav Shah",   email: "aarav.shah@example.com",   phone: "+91-98765-43210", orders_count: 8,  total_spent: 2349.92, status: "vip"      },
    { name: "Priya Mehta",  email: "priya.mehta@example.com",  phone: "+91-87654-32109", orders_count: 5,  total_spent: 899.95,  status: "active"   },
    { name: "Rohan Verma",  email: "rohan.verma@example.com",  phone: null,              orders_count: 2,  total_spent: 379.98,  status: "active"   },
    { name: "Sneha Patel",  email: "sneha.patel@example.com",  phone: "+91-76543-21098", orders_count: 12, total_spent: 4199.88, status: "vip"      },
    { name: "Karan Joshi",  email: "karan.joshi@example.com",  phone: "+91-65432-10987", orders_count: 1,  total_spent: 149.99,  status: "active"   },
    { name: "Anita Sharma", email: "anita.sharma@example.com", phone: null,              orders_count: 0,  total_spent: 0,       status: "inactive" },
    { name: "Vikram Singh", email: "vikram.singh@example.com", phone: "+91-54321-09876", orders_count: 6,  total_spent: 1549.94, status: "vip"      },
    { name: "Divya Nair",   email: "divya.nair@example.com",   phone: "+91-43210-98765", orders_count: 3,  total_spent: 529.97,  status: "active"   },
  ];

  await prisma.customer.deleteMany({ where: { owner_id: user.id } });
  await prisma.customer.createMany({
    data: customersData.map((c) => ({ ...c, owner_id: user.id })),
  });
  console.log(`✓ ${customersData.length} customers seeded`);

  // Orders
  const ordersData = [
    { order_number: "ORD-1024", customer_name: "Aarav Shah",   total: 299.99, status: "delivered",  items_count: 1 },
    { order_number: "ORD-1023", customer_name: "Priya Mehta",  total: 149.99, status: "shipped",    items_count: 1 },
    { order_number: "ORD-1022", customer_name: "Rohan Verma",  total: 79.99,  status: "processing", items_count: 1 },
    { order_number: "ORD-1021", customer_name: "Sneha Patel",  total: 589.98, status: "delivered",  items_count: 3 },
    { order_number: "ORD-1020", customer_name: "Karan Joshi",  total: 149.99, status: "processing", items_count: 1 },
    { order_number: "ORD-1019", customer_name: "Vikram Singh", total: 399.99, status: "shipped",    items_count: 2 },
    { order_number: "ORD-1018", customer_name: "Divya Nair",   total: 229.98, status: "delivered",  items_count: 2 },
    { order_number: "ORD-1017", customer_name: "Aarav Shah",   total: 189.99, status: "cancelled",  items_count: 1 },
    { order_number: "ORD-1016", customer_name: "Sneha Patel",  total: 499.97, status: "delivered",  items_count: 4 },
    { order_number: "ORD-1015", customer_name: "Priya Mehta",  total: 99.99,  status: "delivered",  items_count: 1 },
  ];

  await prisma.order.deleteMany({ where: { owner_id: user.id } });
  await prisma.order.createMany({
    data: ordersData.map((o) => ({ ...o, owner_id: user.id })),
  });
  console.log(`✓ ${ordersData.length} orders seeded`);

  // Notifications
  const notificationsData = [
    { title: "New order received",      desc: "ORD-1024 from Aarav Shah · $299.99",          type: "order",    read: false },
    { title: "5-star review posted",    desc: "Sneha Patel reviewed Smart Fitness Tracker",   type: "review",   read: false },
    { title: "Revenue milestone hit!",  desc: "Monthly revenue crossed $10,000",              type: "revenue",  read: true  },
    { title: "New customer registered", desc: "Divya Nair joined VendorHub",                  type: "customer", read: true  },
    { title: "Order status updated",    desc: "ORD-1020 marked as Shipped",                   type: "order",    read: true  },
  ];

  await prisma.notification.deleteMany({ where: { owner_id: user.id } });
  await prisma.notification.createMany({
    data: notificationsData.map((n) => ({ ...n, owner_id: user.id })),
  });
  console.log(`✓ ${notificationsData.length} notifications seeded`);

  // Pricing Plans
  const pricingData = [
    {
      id: "free",
      name: "Starter",
      price: 0,
      yearly_price: 0,
      period: "forever",
      description: "Perfect to get started",
      badge: null,
      highlight: false,
      active: true,
      subscribers: 1240,
      features: JSON.stringify(["Up to 50 products","100 orders/month","50 customers","Basic analytics","Email notifications","Community support"]),
      sort_order: 1,
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      yearly_price: 24,
      period: "month",
      description: "For growing businesses",
      badge: "Most Popular",
      highlight: true,
      active: true,
      subscribers: 892,
      features: JSON.stringify(["Unlimited products","Unlimited orders","Unlimited customers","Advanced analytics","Revenue reports","Priority support","Data export","Custom notifications"]),
      sort_order: 2,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 79,
      yearly_price: 65,
      period: "month",
      description: "For large-scale vendors",
      badge: "Best Value",
      highlight: false,
      active: true,
      subscribers: 156,
      features: JSON.stringify(["Everything in Pro","Multi-user access","REST API access","Custom integrations","Dedicated account manager","SLA guarantee","White-label option","Onboarding call"]),
      sort_order: 3,
    },
  ];

  for (const plan of pricingData) {
    await prisma.pricingPlan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
  }
  console.log(`✓ ${pricingData.length} pricing plans seeded`);

  // Reviews
  const reviewsData = [
    { customer_name: "Aarav Shah",   product_name: "Wireless Noise-Cancelling Headphones", rating: 5, comment: "Absolutely love this product! Best headphones I've ever used. Sound quality is incredible.", status: "published" },
    { customer_name: "Priya Mehta",  product_name: "Smart Fitness Tracker Pro",            rating: 4, comment: "Great tracker, very accurate. Battery life could be better but overall very happy.", status: "published" },
    { customer_name: "Sneha Patel",  product_name: "Mechanical Keyboard RGB",              rating: 5, comment: "The typing feel is amazing. RGB lighting is beautiful. Highly recommend!", status: "published" },
    { customer_name: "Karan Joshi",  product_name: "4K Webcam Pro",                        rating: 3, comment: "Good quality but a bit pricey for what it offers. Setup was easy though.", status: "published" },
    { customer_name: "Vikram Singh", product_name: "Portable SSD 1TB",                    rating: 5, comment: "Super fast and compact. Transferred 50GB in under a minute. Perfect for travel.", status: "published" },
    { customer_name: "Divya Nair",   product_name: "True Wireless Earbuds",               rating: 4, comment: "Great sound and ANC. Fit is comfortable for long listening sessions.", status: "published" },
    { customer_name: "Rohan Verma",  product_name: "Gaming Mouse Pro",                    rating: 2, comment: "Feels a bit cheap for the price. The scroll wheel is stiff. Expected better.", status: "pending"   },
    { customer_name: "Anita Sharma", product_name: "Smart Watch Series X",                rating: 5, comment: "Incredible watch. Health tracking is spot on and the display is gorgeous.", status: "published" },
  ];

  await prisma.review.deleteMany({ where: { owner_id: user.id } });
  await prisma.review.createMany({
    data: reviewsData.map((r) => ({ ...r, owner_id: user.id })),
  });
  console.log(`✓ ${reviewsData.length} reviews seeded`);

  console.log("\n✅ Database seeded successfully!");
  console.log("   Login: admin@vendorhub.io / admin123\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
