import { useState, useMemo } from 'react'
import './AdminPanel.css'

export default function AdminPanel({
  products,
  setProducts,
  orders,
  setOrders,
  users,
  onClose,
  onLogout,
  money,
  departments,
  initialProducts,
}) {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard' | 'products' | 'orders' | 'users'
  const [productSearch, setProductSearch] = useState('')
  const [orderFilter, setOrderFilter] = useState('ALL')
  const [editingProduct, setEditingProduct] = useState(null)
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'WOMEN',
    price: '',
    image: '',
  })
  const [formError, setFormError] = useState('')
  const [successToast, setSuccessToast] = useState('')

  const showToast = (msg) => {
    setSuccessToast(msg)
    setTimeout(() => {
      setSuccessToast('')
    }, 3500)
  }

  // Dashboard calculations
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0)
  }, [orders])

  const totalOrders = orders.length
  const totalProducts = products.length
  const totalUsers = users.length

  // Filtered products
  const visibleProducts = useMemo(() => {
    const term = productSearch.trim().toLowerCase()
    return products.filter((p) => {
      if (!term) return true
      return (
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        String(p.id).includes(term)
      )
    })
  }, [products, productSearch])

  // Filtered orders
  const visibleOrders = useMemo(() => {
    if (orderFilter === 'ALL') return orders
    return orders.filter((o) => o.status === orderFilter)
  }, [orders, orderFilter])

  // Product CRUD
  const handleOpenAddProduct = () => {
    setEditingProduct(null)
    setProductForm({
      name: '',
      category: departments[0] || 'WOMEN',
      price: '',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=700&q=85',
    })
    setFormError('')
    setIsProductModalOpen(true)
  }

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod)
    setProductForm({
      name: prod.name,
      category: prod.category,
      price: prod.price,
      image: prod.image,
    })
    setFormError('')
    setIsProductModalOpen(true)
  }

  const handleSaveProduct = (e) => {
    e.preventDefault()
    setFormError('')

    if (!productForm.name.trim()) {
      setFormError('Product name is required.')
      return
    }
    const numPrice = parseFloat(productForm.price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid price greater than 0.')
      return
    }
    if (!productForm.image.trim()) {
      setFormError('Please provide a valid product image URL.')
      return
    }

    if (editingProduct) {
      // Update existing
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: productForm.name.trim(),
                category: productForm.category,
                price: parseFloat(numPrice.toFixed(2)),
                image: productForm.image.trim(),
              }
            : p,
        ),
      )
      showToast(`Updated product "${productForm.name}"`)
    } else {
      // Create new
      const nextId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1
      const newProd = {
        id: nextId,
        name: productForm.name.trim(),
        category: productForm.category,
        price: parseFloat(numPrice.toFixed(2)),
        image: productForm.image.trim(),
      }
      setProducts((prev) => [newProd, ...prev])
      showToast(`Added new product "${newProd.name}"`)
    }

    setIsProductModalOpen(false)
  }

  const handleDeleteProduct = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the store catalog?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
      showToast(`Deleted "${name}"`)
    }
  }

  const handleResetCatalog = () => {
    if (window.confirm('Reset catalog back to initial default items? Custom products will be replaced.')) {
      setProducts(initialProducts)
      showToast('Catalog reset to initial products')
    }
  }

  // Order status update
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
    )
    showToast(`Order ${orderId} updated to "${newStatus}"`)
  }

  const handleDeleteOrder = (orderId) => {
    if (window.confirm(`Delete order ${orderId}? This cannot be undone.`)) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId))
      showToast(`Deleted order ${orderId}`)
    }
  }

  return (
    <div className="admin-wrapper">
      {/* Top Admin Bar */}
      <header className="admin-topbar">
        <div className="admin-brand-section">
          <span className="admin-badge">ADMIN</span>
          <span className="admin-title">STYLECART MANAGEMENT PORTAL</span>
        </div>

        <div className="admin-user-info">
          <span className="admin-user-pill">
            <span className="admin-dot" /> alizay111 (Administrator)
          </span>
          <button className="admin-nav-btn secondary" onClick={onClose} title="Go to storefront">
            VIEW STOREFRONT →
          </button>
          <button className="admin-nav-btn logout" onClick={onLogout} title="Log out as administrator">
            SIGN OUT
          </button>
        </div>
      </header>

      {/* Toast notification */}
      {successToast && (
        <div className="admin-toast" role="status">
          ✓ {successToast}
        </div>
      )}

      {/* Main Admin Navigation */}
      <nav className="admin-tabs" aria-label="Admin Navigation Tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard Overview
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          🛍 Catalog & Products ({totalProducts})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders ({totalOrders})
        </button>
        <button
          className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Registered Customers ({totalUsers})
        </button>
      </nav>

      {/* Admin Content Area */}
      <main className="admin-content">
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <div className="admin-metrics-grid">
              <div className="metric-card">
                <span className="metric-label">TOTAL SALES REVENUE</span>
                <strong className="metric-value">{money(totalRevenue)}</strong>
                <span className="metric-sub">Across {totalOrders} demo order(s)</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">TOTAL ORDERS PLACED</span>
                <strong className="metric-value">{totalOrders}</strong>
                <span className="metric-sub">Cash on Delivery</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">CATALOG PRODUCTS</span>
                <strong className="metric-value">{totalProducts}</strong>
                <span className="metric-sub">Active in store</span>
              </div>
              <div className="metric-card">
                <span className="metric-label">REGISTERED CUSTOMERS</span>
                <strong className="metric-value">{totalUsers}</strong>
                <span className="metric-sub">Demo member accounts</span>
              </div>
            </div>

            <div className="admin-quick-actions">
              <h3>Quick Store Actions</h3>
              <div className="action-buttons-row">
                <button className="primary-action-btn" onClick={handleOpenAddProduct}>
                  + Add New Product
                </button>
                <button className="secondary-action-btn" onClick={() => setActiveTab('orders')}>
                  Manage Customer Orders ({totalOrders})
                </button>
                <button className="secondary-action-btn" onClick={() => setActiveTab('products')}>
                  Edit Product Catalog
                </button>
                <button className="danger-action-btn" onClick={handleResetCatalog}>
                  Reset Catalog to Defaults
                </button>
              </div>
            </div>

            <div className="admin-recent-section">
              <div className="section-header-split">
                <h3>Recent Orders</h3>
                {orders.length > 0 && (
                  <button className="text-link-btn" onClick={() => setActiveTab('orders')}>
                    View all orders →
                  </button>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="admin-empty-state">
                  <p>No customer orders have been placed yet.</p>
                  <small>Place a test order on the storefront to see it appear here in real time.</small>
                </div>
              ) : (
                <div className="admin-table-container">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Quick Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 5).map((order) => (
                        <tr key={order.id}>
                          <td><strong>{order.id}</strong></td>
                          <td>
                            {order.customer?.fullName || 'Guest'}<br />
                            <small className="cell-muted">{order.customer?.email}</small>
                          </td>
                          <td>{order.items?.reduce((s, i) => s + i.quantity, 0) || 0} pcs</td>
                          <td><strong>{money(order.total)}</strong></td>
                          <td>{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                          <td>
                            <span className={`status-pill ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                              {order.status}
                            </span>
                          </td>
                          <td>
                            <select
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                              className="admin-select-sm"
                            >
                              <option value="Demo order placed">Placed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS */}
        {activeTab === 'products' && (
          <div className="admin-products-tab">
            <div className="admin-toolbar">
              <div className="toolbar-left">
                <input
                  type="text"
                  placeholder="Search products by title, category, ID..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="admin-search-input"
                />
                <span className="results-count">{visibleProducts.length} product(s) found</span>
              </div>
              <div className="toolbar-right">
                <button className="primary-action-btn" onClick={handleOpenAddProduct}>
                  + Add New Product
                </button>
              </div>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ width: '65px' }}>
                        <img
                          src={p.image}
                          alt={p.name}
                          className="product-thumbnail"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80'
                          }}
                        />
                      </td>
                      <td>
                        <strong>{p.name}</strong>
                        <div className="cell-muted">ID: #{p.id}</div>
                      </td>
                      <td>
                        <span className="category-pill">{p.category}</span>
                      </td>
                      <td>
                        <strong>{money(p.price)}</strong>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="table-btn edit"
                          onClick={() => handleOpenEditProduct(p)}
                          title="Edit product"
                        >
                          Edit
                        </button>
                        <button
                          className="table-btn delete"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          title="Delete product"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {visibleProducts.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '36px' }}>
                        No products match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDERS */}
        {activeTab === 'orders' && (
          <div className="admin-orders-tab">
            <div className="admin-toolbar">
              <div className="toolbar-left">
                <label className="filter-label">Filter by Status:</label>
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="admin-select"
                >
                  <option value="ALL">All Orders ({orders.length})</option>
                  <option value="Demo order placed">Placed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {visibleOrders.length === 0 ? (
              <div className="admin-empty-state">
                <p>No orders found matching this filter.</p>
              </div>
            ) : (
              <div className="orders-cards-list">
                {visibleOrders.map((order) => (
                  <article className="admin-order-card" key={order.id}>
                    <div className="order-header">
                      <div>
                        <strong className="order-code">{order.id}</strong>
                        <span className="order-date">
                          Placed on {new Date(order.createdAt).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="order-status-wrap">
                        <label>Status:</label>
                        <select
                          value={order.status}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                          className="admin-select-status"
                        >
                          <option value="Demo order placed">Demo order placed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          className="table-btn delete sm"
                          onClick={() => handleDeleteOrder(order.id)}
                          title="Delete Order"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="order-body-grid">
                      <div className="order-customer-box">
                        <h4>Customer & Shipping Details</h4>
                        <p><strong>Name:</strong> {order.customer?.fullName}</p>
                        <p><strong>Email:</strong> {order.customer?.email}</p>
                        <p><strong>Phone:</strong> {order.customer?.phone || 'N/A'}</p>
                        <p><strong>Address:</strong> {order.customer?.address}, {order.customer?.city}, {order.customer?.postcode}</p>
                        <p><strong>Payment:</strong> {order.paymentMethod}</p>
                      </div>

                      <div className="order-items-box">
                        <h4>Ordered Items</h4>
                        <div className="order-items-table">
                          {order.items?.map((item, idx) => (
                            <div className="order-item-row" key={idx}>
                              <img src={item.image} alt={item.name} className="mini-item-img" />
                              <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                <span className="item-meta">
                                  {item.quantity} × {money(item.price)}
                                </span>
                              </div>
                              <strong>{money(item.price * item.quantity)}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="order-total-row">
                          <span>Total Amount Paid / Due:</span>
                          <strong>{money(order.total)}</strong>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: USERS */}
        {activeTab === 'users' && (
          <div className="admin-users-tab">
            <div className="admin-toolbar">
              <span className="results-count">Total registered customer accounts: {users.length}</span>
            </div>

            {users.length === 0 ? (
              <div className="admin-empty-state">
                <p>No customer accounts have registered yet.</p>
                <small>Create an account through the storefront Sign Up form to populate this table.</small>
              </div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Full Name</th>
                      <th>Email Address</th>
                      <th>Member Since</th>
                      <th>Orders Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const userOrdersCount = orders.filter((o) => o.userId === u.id).length
                      return (
                        <tr key={u.id}>
                          <td><code>{u.id}</code></td>
                          <td><strong>{u.name}</strong></td>
                          <td>{u.email}</td>
                          <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB') : 'Initial'}</td>
                          <td>
                            <span className="status-pill placed">{userOrdersCount} order(s)</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsProductModalOpen(false)}>
          <div className="admin-product-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsProductModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <span className="modal-eyebrow">CATALOG MANAGEMENT</span>
            <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <p className="modal-intro">
              {editingProduct
                ? 'Update product details, pricing, and category.'
                : 'Add a new product to your StyleCart inventory.'}
            </p>

            <form onSubmit={handleSaveProduct} className="admin-form">
              <label>
                Product Title / Name *
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Classic Trench Coat"
                />
              </label>

              <div className="form-split">
                <label>
                  Category *
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price (£ GBP) *
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="e.g. 29.99"
                  />
                </label>
              </div>

              <label>
                Product Image URL *
                <input
                  type="url"
                  required
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                />
              </label>

              {productForm.image && (
                <div className="image-preview-box">
                  <span>Image Preview:</span>
                  <img
                    src={productForm.image}
                    alt="Preview"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}

              {formError && <p className="form-error" role="alert">{formError}</p>}

              <div className="modal-actions">
                <button type="submit" className="primary-action-btn full">
                  {editingProduct ? 'SAVE CHANGES' : 'CREATE PRODUCT'}
                </button>
                <button
                  type="button"
                  className="secondary-action-btn full"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
