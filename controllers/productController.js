import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { renderBaseLayout, isHtmlRequest } from '../utils/viewRenderer.js';

export const getAllProducts = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { category, search, flashSale, sort, brand, minPrice, maxPrice, limit = 50, page = 1 } = req.query;

    const query = {};

    if (category && category !== 'all') {
      query.categorySlug = category.toLowerCase();
    }

    if (flashSale === 'true') {
      query.isFlashSale = true;
    }

    if (brand) {
      query.brand = new RegExp(brand, 'i');
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'price-asc') sortOptions = { price: 1 };
    else if (sort === 'price-desc') sortOptions = { price: -1 };
    else if (sort === 'rating') sortOptions = { rating: -1 };
    else if (sort === 'sold') sortOptions = { soldCount: -1 };

    const parsedLimit = parseInt(limit, 10);
    const parsedPage = parseInt(page, 10);
    const skip = (parsedPage - 1) * parsedLimit;

    const totalCount = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parsedLimit);

    // Check if client expects HTML Component view or raw JSON
    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const categories = await Category.find({}).catch(() => []);
      
      const cardsHtml = products.length === 0
        ? `<div class="card" style="text-align: center; padding: 3rem; grid-column: 1 / -1;">
            <h3 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 0.5rem;">No Products Found</h3>
            <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem;">No products match your search or category filter.</p>
            <a href="/products" class="btn btn-emerald btn-sm">Reset All Filters</a>
          </div>`
        : products.map((p) => {
            const img = p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
            const discPill = p.discountPercentage > 0 ? `<span class="discount-pill">-${p.discountPercentage}%</span>` : '';
            const flashBadge = p.isFlashSale ? `<span class="badge-pill badge-flash">⚡ Flash Sale</span>` : '';
            const officialBadge = p.isOfficial ? `<span class="badge-pill badge-official">🛡️ Official Mall</span>` : '';
            const freeDelBadge = p.isFreeDelivery ? `<span class="badge-pill badge-free-del">🚚 Free Delivery</span>` : '';

            return `
            <div class="product-card" id="card-${p._id}">
              <div class="product-img-wrap">
                <div class="product-badge-corner">
                  ${flashBadge}
                  ${officialBadge}
                  ${freeDelBadge}
                </div>
                <img src="${img}" alt="${p.title}" class="product-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'" />
              </div>
              <div class="product-body">
                <div class="product-meta">
                  <span>${p.category || 'General'}</span>
                  <span>Brand: <strong>${p.brand || 'Zaraz'}</strong></span>
                </div>
                <a href="/products/${p._id}" class="product-title" title="${p.title}">${p.title}</a>
                <div class="price-wrap">
                  <span class="current-price">৳${p.price.toLocaleString()}</span>
                  ${p.originalPrice > p.price ? `<span class="orig-price">৳${p.originalPrice.toLocaleString()}</span>` : ''}
                  ${discPill}
                </div>
                <div class="product-footer">
                  <div class="rating-wrap">
                    <span>★</span>
                    <span>${p.rating || 4.8}</span>
                    <span style="color: var(--muted); font-size: 0.7rem;">(${p.reviewsCount || 0})</span>
                  </div>
                  <div style="font-size: 0.72rem; color: ${p.stock > 0 ? '#34d399' : '#f87171'}; font-weight: 600;">
                    ${p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}
                  </div>
                </div>
                <div style="display: flex; gap: 0.4rem; margin-top: 0.85rem;">
                  <a href="/products/${p._id}" class="btn btn-secondary btn-sm" style="flex: 1;">Inspect</a>
                  <a href="/products/${p._id}?format=json" target="_blank" class="btn btn-secondary btn-sm" title="View JSON">JSON</a>
                  <button onclick="handleDeleteProduct('${p._id}', '${p.title.replace(/'/g, "\\'")}')" class="btn btn-danger btn-sm" title="Delete Product">✕</button>
                </div>
              </div>
            </div>`;
          }).join('');

      const categoryOptions = categories.map((c) => 
        `<option value="${c.slug}" ${category === c.slug ? 'selected' : ''}>${c.name}</option>`
      ).join('');

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>🛍️ Products Catalog Component</h2>
            <p>Component View of live e-commerce inventory synced with MongoDB Atlas (<code>zaraz_db</code>)</p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap;">
            <span class="badge-api">GET /products</span>
            <button onclick="openModal('addProductModal')" class="btn btn-emerald btn-sm">+ Add New Product</button>
          </div>
        </div>

        <!-- Filter & Search Bar Component -->
        <div class="card" style="margin-bottom: 2rem; padding: 1.25rem;">
          <form method="GET" action="/products" style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <input type="text" name="search" value="${search || ''}" placeholder="Search products by title, brand, description..." class="form-control" style="flex: 2; min-width: 220px;" />
            <select name="category" class="form-control" style="flex: 1; min-width: 160px;">
              <option value="all">All Categories</option>
              ${categoryOptions}
            </select>
            <select name="sort" class="form-control" style="flex: 1; min-width: 140px;">
              <option value="latest" ${sort === 'latest' ? 'selected' : ''}>Latest Arrivals</option>
              <option value="price-asc" ${sort === 'price-asc' ? 'selected' : ''}>Price: Low to High</option>
              <option value="price-desc" ${sort === 'price-desc' ? 'selected' : ''}>Price: High to Low</option>
              <option value="rating" ${sort === 'rating' ? 'selected' : ''}>Customer Rating</option>
              <option value="sold" ${sort === 'sold' ? 'selected' : ''}>Most Popular / Sold</option>
            </select>
            <button type="submit" class="btn btn-emerald btn-sm">Filter Catalog</button>
            ${(search || category || sort) ? `<a href="/products" class="btn btn-secondary btn-sm">Reset</a>` : ''}
          </form>
        </div>

        <!-- Catalog Metrics Summary -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div style="font-size: 0.85rem; color: var(--muted);">
            Showing <strong style="color: #fff;">${products.length}</strong> of <strong style="color: var(--emerald-light);">${totalCount}</strong> products in catalog
          </div>
          <div style="font-size: 0.75rem; color: var(--muted);">
            Page ${parsedPage} of ${Math.ceil(totalCount / parsedLimit) || 1}
          </div>
        </div>

        <!-- Product Cards Grid Component -->
        <div class="product-grid">
          ${cardsHtml}
        </div>

        <!-- Add Product Modal Component -->
        <div id="addProductModal" class="modal-backdrop">
          <div class="modal-box">
            <div class="modal-header">
              <h3>📦 Add New Product to Zaraz Catalog</h3>
              <button onclick="closeModal('addProductModal')" class="close-btn">&times;</button>
            </div>
            <form id="addProductForm" onsubmit="handleCreateProduct(event)">
              <div class="form-group">
                <label>Product Title *</label>
                <input type="text" id="pTitle" required class="form-control" placeholder="e.g. Wireless Active Noise Cancelling Headphones" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Brand *</label>
                  <input type="text" id="pBrand" required class="form-control" placeholder="e.g. Sony, Apple, Samsung" />
                </div>
                <div class="form-group">
                  <label>Category *</label>
                  <select id="pCategory" required class="form-control">
                    ${categories.map(c => `<option value="${c.name}|${c.slug}">${c.name}</option>`).join('')}
                    ${categories.length === 0 ? '<option value="Electronics|electronics">Electronics</option>' : ''}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Selling Price (৳ BDT) *</label>
                  <input type="number" id="pPrice" required min="1" class="form-control" placeholder="e.g. 4500" />
                </div>
                <div class="form-group">
                  <label>Original Regular Price (৳ BDT)</label>
                  <input type="number" id="pOrigPrice" min="1" class="form-control" placeholder="e.g. 5990" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Inventory Stock *</label>
                  <input type="number" id="pStock" required min="0" value="25" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Primary Image URL</label>
                  <input type="url" id="pImage" class="form-control" placeholder="https://images.unsplash.com/..." />
                </div>
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea id="pDesc" rows="3" class="form-control" placeholder="Detailed product specifications, key features, and highlights..."></textarea>
              </div>
              <div style="display: flex; gap: 1rem; margin-top: 1.5rem; justify-content: flex-end;">
                <button type="button" onclick="closeModal('addProductModal')" class="btn btn-secondary">Cancel</button>
                <button type="submit" class="btn btn-emerald">Publish to Catalog</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const extraScripts = `
        <script>
          async function handleCreateProduct(e) {
            e.preventDefault();
            const [categoryName, categorySlug] = document.getElementById('pCategory').value.split('|');
            const price = Number(document.getElementById('pPrice').value);
            const orig = Number(document.getElementById('pOrigPrice').value) || price;
            const discountPercentage = orig > price ? Math.round(((orig - price) / orig) * 100) : 0;

            const payload = {
              title: document.getElementById('pTitle').value,
              brand: document.getElementById('pBrand').value,
              category: categoryName,
              categorySlug: categorySlug,
              price: price,
              originalPrice: orig,
              discountPercentage: discountPercentage,
              stock: Number(document.getElementById('pStock').value),
              images: [document.getElementById('pImage').value || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80'],
              description: document.getElementById('pDesc').value,
              isOfficial: true,
              isFreeDelivery: true
            };

            try {
              const res = await fetch('/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              const data = await res.json();
              if (data.success) {
                showToast('Product published successfully!');
                closeModal('addProductModal');
                setTimeout(() => window.location.reload(), 800);
              } else {
                showToast(data.message || 'Failed to create product', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }

          async function handleDeleteProduct(id, title) {
            if (!confirm('Are you sure you want to delete "' + title + '" from the catalog?')) return;
            try {
              const res = await fetch('/products/' + id, { method: 'DELETE' });
              const data = await res.json();
              if (data.success) {
                showToast('Product deleted successfully');
                const card = document.getElementById('card-' + id);
                if (card) card.remove();
              } else {
                showToast(data.message || 'Failed to delete product', 'error');
              }
            } catch (err) {
              showToast(err.message, 'error');
            }
          }
        </script>
      `;

      return res.status(200).send(renderBaseLayout({
        title: 'Products Catalog Component',
        activeNav: 'products',
        content: htmlContent,
        jsonUrl: `/products?format=json${search ? `&search=${encodeURIComponent(search)}` : ''}${category ? `&category=${encodeURIComponent(category)}` : ''}`,
        extraScripts,
      }));
    }

    // Default JSON response for API clients
    res.status(200).json({
      success: true,
      count: products.length,
      totalCount,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit),
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message,
    });
  }
};

export const getProductById = async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const { id } = req.params;
    let product;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(id);
    }

    if (!product) {
      product = await Product.findOne({ slug: id.toLowerCase() });
    }

    if (!product) {
      const wantsHtml = isHtmlRequest(req);

      if (wantsHtml) {
        return res.status(404).send(renderBaseLayout({
          title: 'Product Not Found',
          activeNav: 'products',
          content: `
            <div class="card" style="text-align: center; padding: 4rem 2rem;">
              <h2 style="font-size: 1.5rem; font-weight: 800; color: #f87171; margin-bottom: 0.5rem;">404 - Product Not Found</h2>
              <p style="color: var(--muted); margin-bottom: 2rem;">No product matched ID or slug: <code>${id}</code></p>
              <a href="/products" class="btn btn-emerald">Back to Products Catalog</a>
            </div>
          `,
          jsonUrl: `/products/${id}?format=json`,
        }));
      }

      return res.status(404).json({
        success: false,
        message: `Product not found with id or slug: ${id}`,
      });
    }

    const wantsHtml = isHtmlRequest(req);

    if (wantsHtml) {
      const img = product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80';
      const gallery = (product.images || []).map(imgUrl => 
        `<img src="${imgUrl}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid var(--card-border);" />`
      ).join('');

      const specsRows = product.specifications instanceof Map
        ? Array.from(product.specifications.entries()).map(([k, v]) => `<tr><td style="color: var(--muted); width: 40%;">${k}</td><td><strong>${v}</strong></td></tr>`).join('')
        : typeof product.specifications === 'object' && product.specifications !== null
        ? Object.entries(product.specifications).map(([k, v]) => `<tr><td style="color: var(--muted); width: 40%;">${k}</td><td><strong>${v}</strong></td></tr>`).join('')
        : '<tr><td colspan="2">Standard manufacturer specifications</td></tr>';

      const htmlContent = `
        <div class="page-header">
          <div class="page-title">
            <h2>📦 Product Detail Component</h2>
            <p>Single Product Component View &bull; ID: <code>${product._id}</code></p>
          </div>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <a href="/products" class="btn btn-secondary btn-sm">&larr; Back to Products</a>
            <a href="/products/${product._id}?format=json" target="_blank" class="btn btn-secondary btn-sm">View Raw JSON</a>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 2rem; margin-bottom: 2.5rem;">
          <!-- Left: Gallery & Image Component -->
          <div class="card" style="padding: 1.5rem;">
            <div style="width: 100%; height: 380px; background: #050a10; border-radius: 12px; overflow: hidden; margin-bottom: 1rem;">
              <img src="${img}" alt="${product.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80'" />
            </div>
            ${gallery ? `<div style="display: flex; gap: 0.6rem; overflow-x: auto;">${gallery}</div>` : ''}
          </div>

          <!-- Right: Details, Pricing & Seller Component -->
          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div class="card">
              <div style="display: flex; gap: 0.5rem; margin-bottom: 0.75rem;">
                <span class="badge-pill badge-official">Official Mall</span>
                ${product.isFlashSale ? '<span class="badge-pill badge-flash">⚡ Flash Deal</span>' : ''}
                ${product.isFreeDelivery ? '<span class="badge-pill badge-free-del">🚚 Free Delivery</span>' : ''}
              </div>
              <h1 style="font-size: 1.45rem; font-weight: 800; color: #fff; margin-bottom: 0.75rem;">${product.title}</h1>
              <div style="display: flex; align-items: center; gap: 1.5rem; font-size: 0.8rem; color: var(--muted); margin-bottom: 1.25rem;">
                <span>Brand: <strong style="color: #fff;">${product.brand}</strong></span>
                <span>Category: <strong style="color: var(--emerald-light);">${product.category}</strong></span>
                <span style="color: #fbbf24;">★ ${product.rating || 4.8} (${product.reviewsCount || 0} Reviews)</span>
                <span>Sold: ${product.soldCount || 0}</span>
              </div>
              <div style="background: #060c14; border: 1px solid var(--card-border); border-radius: 12px; padding: 1.25rem; display: flex; align-items: baseline; gap: 1rem; margin-bottom: 1.25rem;">
                <span style="font-size: 2rem; font-weight: 800; color: var(--emerald-light);">৳${product.price.toLocaleString()}</span>
                ${product.originalPrice > product.price ? `<span style="font-size: 1.1rem; color: #64748b; text-decoration: line-through;">৳${product.originalPrice.toLocaleString()}</span>` : ''}
                ${product.discountPercentage > 0 ? `<span class="discount-pill">-${product.discountPercentage}% OFF</span>` : ''}
              </div>
              <p style="font-size: 0.9rem; color: #cbd5e1; line-height: 1.6; margin-bottom: 1.5rem;">${product.description || 'Full product description and high-grade quality guaranteed by Zaraz Official Store.'}</p>
              <div style="display: flex; gap: 0.75rem;">
                <a href="${process.env.CLIENT_URL || 'https://zaraz-shopping.vercel.app'}/products/${product._id}" target="_blank" class="btn btn-emerald" style="flex: 1;">Open on Zaraz Storefront &rarr;</a>
              </div>
            </div>

            <!-- Logistics & Seller Card -->
            <div class="card" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;">
              <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--muted); font-weight: 700; margin-bottom: 0.35rem;">Seller Guarantee</div>
                <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${product.seller?.name || 'Zaraz Mall Official'}</div>
                <div style="font-size: 0.78rem; color: var(--emerald-light); margin-top: 0.2rem;">★ ${product.seller?.rating || 4.9} &bull; ${product.seller?.responseRate || '98% Response'}</div>
              </div>
              <div>
                <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--muted); font-weight: 700; margin-bottom: 0.35rem;">Delivery Logistics</div>
                <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">${product.deliveryInfo?.standardDays || '2 - 3 Days'}</div>
                <div style="font-size: 0.78rem; color: var(--muted); margin-top: 0.2rem;">Standard Fee: ৳${product.deliveryInfo?.standardFee || 60}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Specifications Table Component -->
        <div class="table-card">
          <div style="padding: 1rem 1.25rem; background: #08121f; border-bottom: 1px solid var(--card-border); font-weight: 700; font-size: 0.9rem; color: #fff;">
            Technical Specifications & Details
          </div>
          <table>
            <tbody>
              ${specsRows}
            </tbody>
          </table>
        </div>
      `;

      return res.status(200).send(renderBaseLayout({
        title: product.title,
        activeNav: 'products',
        content: htmlContent,
        jsonUrl: `/products/${product._id}?format=json`,
      }));
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving product',
      error: error.message,
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const body = req.body;
    const slug =
      body.slug ||
      body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const newProduct = await Product.create({
      ...body,
      slug,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully in Zaraz Catalog',
      product: newProduct,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create product',
      error: error.message,
    });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for update',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update product',
      error: error.message,
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Product not found for deletion',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product removed successfully from inventory',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message,
    });
  }
};
