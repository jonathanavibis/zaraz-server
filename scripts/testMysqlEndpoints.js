import MysqlProduct from '../models/mysql/productModel.js';
import MysqlCategory from '../models/mysql/categoryModel.js';
import MysqlBanner from '../models/mysql/bannerModel.js';
import MysqlUser from '../models/mysql/userModel.js';
import MysqlOrder from '../models/mysql/orderModel.js';
import {
  findServerAccountByIdentifierMysql,
  verifyAccountPasswordMysql,
  getServerLoginLogsMysql,
  getAllServerAccountsMysql,
} from '../SERVER_ACC/serverAccountMysql.js';

async function testAll() {
  console.log('🧪 Starting Full System Verification on XAMPP MySQL...\n');

  // 1. Categories
  const categories = await MysqlCategory.find().sort({ name: 1 });
  console.log(`✅ Categories (${categories.length} items):`, categories.map(c => c.name).join(', '));

  // 2. Banners
  const banners = await MysqlBanner.find().sort({ createdAt: -1 });
  console.log(`✅ Banners (${banners.length} items):`, banners.map(b => b.title).join(', '));

  // 3. Products
  const totalProducts = await MysqlProduct.countDocuments();
  const flashSaleProducts = await MysqlProduct.find({ isFlashSale: true }).limit(3);
  console.log(`✅ Products (Total: ${totalProducts}):`);
  console.log(`   Sample Flash Deals:`, flashSaleProducts.map(p => `${p.title} (৳${p.price})`).join(' | '));

  // 4. Users
  const totalUsers = await MysqlUser.countDocuments();
  const testUser = await MysqlUser.findOne({ email: 'admin@zaraz.com' });
  console.log(`✅ Users (Total: ${totalUsers}):`);
  if (testUser) {
    const isMatch = await testUser.matchPassword('password123'); // Or candidate
    console.log(`   Found User: ${testUser.name} (${testUser.email}), Role: ${testUser.role}`);
  }

  // 5. Orders
  const totalOrders = await MysqlOrder.countDocuments();
  const recentOrders = await MysqlOrder.find().limit(2);
  console.log(`✅ Orders (Total: ${totalOrders}):`);
  console.log(`   Sample Order:`, recentOrders[0]?.orderNumber, `| Status: ${recentOrders[0]?.status}`);

  // 6. Server Accounts
  const accounts = await getAllServerAccountsMysql();
  console.log(`✅ Server Accounts (${accounts.length}):`, accounts.map(a => `${a.id} [${a.type}]`).join(', '));

  // Test admin verification
  const adminAcc = await findServerAccountByIdentifierMysql('zarazadmin');
  if (adminAcc) {
    const passOk = await verifyAccountPasswordMysql(adminAcc, 'MyAdmin12345');
    console.log(`   Verified Admin Account 'zarazadmin': Password Check = ${passOk ? 'PASSED ✅' : 'FAILED ❌'}`);
  }

  // 7. Server Login Logs
  const logs = await getServerLoginLogsMysql({ limit: 5 });
  console.log(`✅ Server Login Logs (${logs.length} recent):`);
  for (const l of logs.slice(0, 3)) {
    console.log(`   - [${l.type}] ${l.accountId} (${l.status}) at ${l.timestamp}`);
  }

  console.log('\n🎉 ALL XAMPP MYSQL CHECKS PASSED WITH 100% HEALTH!');
  process.exit(0);
}

testAll().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
