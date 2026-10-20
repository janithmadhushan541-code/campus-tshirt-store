export async function up(db) {
  await db.collection('products').createIndex({ category: 1, featured: -1 });
  await db.collection('orders').createIndex({ createdAt: -1 });
}
export async function down(db) {
  await db.collection('products').dropIndex({ category: 1, featured: -1 }).catch(() => {});
  await db.collection('orders').dropIndex({ createdAt: -1 }).catch(() => {});
}
