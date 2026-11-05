import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { renderBaseLayout } from '../utils/viewRenderer.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({}).sort({ name: 1 });

    const wantsHtml =
      req.accepts('html') &&
      !req.query.format?.includes('json') &&
      !req.headers.accept?.includes('application/json');

    if (wantsHtml) {
      // Calculate live product count per category
      const counts = await Product.aggregate([
        { $group: { _id: '$categorySlug', count: { $sum: 1 } } }
      ]);
      const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));

      const cardsHtml = categories.map((c) => {
        const liveCount = countMap[c.slug] || c.itemCount || 0;
        const img = c.image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80';

        return `
        <div class="card" style="display: flex; flex-direction: column; overflow: hidden; padding: 0;">
          <div style="height: 140px; background: #050a10; position: relative; overflow: hidden;">
            <img src="${img}" alt="${c.name}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80'" />
            <div style="position: absolute; top: 10px; right: 10px; background: rgba(4, 19, 13, 0.85); backdrop-filter: blur(8px); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 0.2rem 0.6rem; font-size: 0.72rem; font-weight: 700; color: #34d399;">
              ${liveCount} Items
            </div>
          </div>
          <div style="padding: 1.25rem; display: flex; flex-direction: column; flex: 1;">
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem;">
              <span style="font-size: 1.4rem;">${c.icon || '📦'}</span>
              <h3 style="font-size: 1.05rem; font-weight: 800; color: #fff;">${c.name}</h3>
            </div>
            <div style="font-size: 0.75rem; color: var(--muted); font-family: 'JetBrains Mono', monospace; margin-bottom: 1rem;">
              slug: /${c.slug}
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: auto;">
              <a href="/products?category=${c.slug}" class="btn btn-emerald btn-sm" style="flex: 1;">Browse Products</a>
              <a href="/categories/${c.slug}?format=json" target="_blank" class="btn btn-secondary btn-sm" title="View JSON">JSON</a>
            </div>
          </div>
        </div>`;
      }).join('');

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>📁 Categories Management Component</h2>
            <p>E-Commerce Departments & Product Classification synced with MongoDB Atlas (<code>zaraz_db</code>)</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span class="badge-api">GET /categories</span>
            <button onclick="openModal('addCategoryModal')" class="btn btn-emerald btn-sm">+ Add New Category</button>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 2.5rem;">
          ${cardsHtml}
        </div>

        <!-- Add Category Modal -->
        <div id="addCategoryModal" class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>📁 Create New Category</h3>
              <button onclick="closeModal('addCategoryModal')" class="close-btn">&times;</button>
            </div>
            <form id="addCategoryForm" onsubmit="handleCreateCategory(event)">
              <div class="form-group">
                <label>Category Name *</label>
                <input type="text" id="catName" required class="form-control" placeholder="e.g. Smart Watches & Wearables" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>URL Slug (Optional)</label>
                  <input type="text" id="catSlug" class="form-control" placeholder="e.g. smart-watches" />
                </div>
                <div class="form-group">
                  <label>Display Icon (Emoji or Char)</label>
                  <input type="text" id="catIcon" class="form-control" placeholder="e.g. ⌚ or 🎧" />
                </div>
              </div>
              <div class="form-group">
                <label>Banner Image URL</label>
                <input type="url" id="catImage" class="form-control" placeholder="https://images.unsplash.com/..." />
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button type="button" onclick="closeModal('addCategoryModal')" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const extraScripts = `
        <script>
          async function handleCreateCategory(e) {
            e.preventDefault();
            const name = document.getElementById('catName').value;
            const slug = document.getElementById('catSlug').value || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const icon = document.getElementById('catIcon').value || '📦';
            const image = document.getElementById('catImage').value || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80';

            try {
              const res = await fetch('/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, icon, image })
              });
              const data = await res.json();
              if (data.success) {
                showToast('Category created successfully!');
                closeModal('addCategoryModal');
                setTimeout(() => window.location.reload(), 800);
              } else {
                showToast(data.message || 'Failed to create category', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        </script>
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Categories Component',
        activeNav: 'categories',
        content: htmlContent,
        jsonUrl: '/categories?format=json',
        extraScripts,
      }));
    }

    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

export const getCategoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const category = await Category.findOne({ slug: slug.toLowerCase() });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching category',
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, icon, image, itemCount, accentColor } = req.body;
    const slug = req.body.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const category = await Category.create({
      name,
      slug,
      icon: icon || '📦',
      image: image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=500&auto=format&fit=crop&q=80',
      itemCount: itemCount || 0,
      accentColor: accentColor || '#10b981',
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create category',
      error: error.message,
    });
  }
};
