import { useEffect, useMemo, useState } from 'react'
import './App.css'

const products = [
  { id: 1, name: 'Girls Cable Knit Jumper', category: 'GIRLS', price: 19.99, image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=700&q=85' },
  { id: 2, name: 'Boys Casual Sweatshirt', category: 'BOYS', price: 16.99, image: 'https://images.unsplash.com/photo-1503919005314-30d93d07d823?auto=format&fit=crop&w=700&q=85' },
  { id: 3, name: 'Women Everyday Outfit', category: 'WOMEN', price: 29.99, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85' },
  { id: 4, name: 'Modern Living Room Decor', category: 'HOME', price: 24.99, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=85' },
  { id: 5, name: 'Classic Casual Trainers', category: 'MEN', price: 34.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85' },
  { id: 6, name: 'Everyday Shoulder Bag', category: 'WOMEN', price: 22.99, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=700&q=85' },
  { id: 7, name: 'Essential Baby Outfit', category: 'BABY', price: 12.99, image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=700&q=85' },
  { id: 8, name: 'Everyday Sunglasses', category: 'ACCESSORIES', price: 9.99, image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=85' },
]

const departments = [
  'WOMEN', 'MEN', 'BOYS', 'GIRLS', 'HOME',
  'BABY', 'BEAUTY', 'BRANDS', 'GIFTS', 'CLEARANCE',
]

const STORAGE_KEYS = {
  users: 'stylecart_demo_users_v1',
  session: 'stylecart_demo_session_v1',
  cart: 'stylecart_cart_v1',
  orders: 'stylecart_demo_orders_v1',
}

const money = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)

function readStorage(key, fallback) {
  try {
    const value = window.localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function makeId(prefix = 'SC') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`
}

function createSalt() {
  const bytes = window.crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

// Demo-only password hashing. Real customer authentication must use a server service.
async function hashPassword(password, saltHex) {
  if (!window.crypto?.subtle) {
    throw new Error('Secure browser support is required. Please open the site using its HTTPS link.')
  }

  const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map((part) => parseInt(part, 16)))
  const key = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await window.crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  )
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function safeUser(user) {
  return { id: user.id, name: user.name, email: user.email }
}

function App() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart, []))
  const [cartOpen, setCartOpen] = useState(false)
  const [message, setMessage] = useState('')

  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, []))
  const [currentUser, setCurrentUser] = useState(() => readStorage(STORAGE_KEYS.session, null))
  const [orders, setOrders] = useState(() => readStorage(STORAGE_KEYS.orders, []))
  const [accountView, setAccountView] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false })
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [pendingCheckout, setPendingCheckout] = useState(false)

  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [shipping, setShipping] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postcode: '',
  })
  const [orderConfirmation, setOrderConfirmation] = useState(null)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    if (currentUser) {
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(currentUser))
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.session)
    }
  }, [currentUser])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart))
  }, [cart])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders))
  }, [orders])

  const visibleProducts = useMemo(() => products.filter((product) => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    const matchesCategory = category === 'ALL' || product.category === category
    return matchesSearch && matchesCategory
  }), [search, category])

  const addToBag = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
    setMessage(`${product.name} added to your bag`)
  }

  const updateQuantity = (id, change) => {
    setCart((current) =>
      current
        .map((item) => item.id === id ? { ...item, quantity: item.quantity + change } : item)
        .filter((item) => item.quantity > 0),
    )
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const userOrders = currentUser ? orders.filter((order) => order.userId === currentUser.id) : []

  const openAccount = () => {
    setAuthError('')
    setAuthForm({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', acceptTerms: false })
    setAccountView(currentUser ? 'account' : 'auth')
    setAuthMode('login')
  }

  const openCheckout = () => {
    if (cart.length === 0) {
      setMessage('Your bag is empty. Add a product before checkout.')
      return
    }
    setCartOpen(false)
    if (!currentUser) {
      setPendingCheckout(true)
      setAccountView('auth')
      setAuthMode('login')
      setAuthError('Please sign in or create an account before checkout.')
      return
    }
    setShipping((current) => ({
      ...current,
      fullName: current.fullName || currentUser.name,
      email: current.email || currentUser.email,
    }))
    setCheckoutError('')
    setCheckoutOpen(true)
  }

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)

    try {
      const email = authForm.email.trim().toLowerCase()
      const password = authForm.password

      if (!email || !password) {
        setAuthError('Please enter your email and password.')
        return
      }
      if (password.length < 6) {
        setAuthError('Password must contain at least 6 characters.')
        return
      }

      if (authMode === 'signup') {
        const firstName = authForm.firstName.trim()
        const lastName = authForm.lastName.trim()
        const name = `${firstName} ${lastName}`.trim()
        if (!firstName || !lastName) {
          setAuthError('Please enter your first and last name.')
          return
        }
        if (!authForm.acceptTerms) {
          setAuthError('Please accept the Terms of Use and Privacy Policy to continue.')
          return
        }
        if (password !== authForm.confirmPassword) {
          setAuthError('Passwords do not match.')
          return
        }
        if (users.some((user) => user.email === email)) {
          setAuthError('An account with this email already exists. Please sign in.')
          return
        }

        const salt = createSalt()
        const passwordHash = await hashPassword(password, salt)
        const newUser = {
          id: makeId('USER'),
          name,
          email,
          salt,
          passwordHash,
          createdAt: new Date().toISOString(),
        }
        setUsers((current) => [...current, newUser])
        setCurrentUser(safeUser(newUser))
        setAccountView(null)
        setMessage(`Welcome to StyleCart, ${name}! Your demo account has been created.`)
        if (pendingCheckout) {
          setPendingCheckout(false)
          setShipping((current) => ({ ...current, fullName: name, email }))
          setCheckoutOpen(true)
        }
      } else {
        const existingUser = users.find((user) => user.email === email)
        if (!existingUser) {
          setAuthError('No account found with this email. Please sign up first.')
          return
        }
        const passwordHash = await hashPassword(password, existingUser.salt)
        if (passwordHash !== existingUser.passwordHash) {
          setAuthError('Incorrect password. Please try again.')
          return
        }
        setCurrentUser(safeUser(existingUser))
        setAccountView(null)
        setMessage(`Welcome back, ${existingUser.name}!`)
        if (pendingCheckout) {
          setPendingCheckout(false)
          setShipping((current) => ({
            ...current,
            fullName: current.fullName || existingUser.name,
            email: existingUser.email,
          }))
          setCheckoutOpen(true)
        }
      }
    } catch (error) {
      setAuthError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setAccountView(null)
    setMessage('You have been signed out successfully.')
  }

  const handleCheckoutSubmit = (event) => {
    event.preventDefault()
    setCheckoutError('')

    if (!currentUser) {
      setCheckoutOpen(false)
      setAccountView('auth')
      setAuthMode('login')
      setAuthError('Please sign in before placing an order.')
      return
    }
    if (cart.length === 0) {
      setCheckoutError('Your bag is empty.')
      return
    }

    const order = {
      id: makeId('SC'),
      userId: currentUser.id,
      customer: { ...shipping },
      items: cart.map((item) => ({ ...item })),
      total: cartTotal,
      paymentMethod: 'Cash on Delivery (Demo)',
      status: 'Demo order placed',
      createdAt: new Date().toISOString(),
    }

    setOrders((current) => [order, ...current])
    setCart([])
    setCheckoutOpen(false)
    setOrderConfirmation(order)
  }

  const updateShipping = (event) => {
    const { name, value } = event.target
    setShipping((current) => ({ ...current, [name]: value }))
  }

  const closeAuth = () => {
    setAccountView(null)
    setAuthError('')
    setPendingCheckout(false)
  }

  return (
    <div className="store">
      <div className="topbar">
        <strong>NEXT STYLE</strong>
        <span>Discover the latest fashion and home collection</span>
        <span>UK COLLECTION · GBP £</span>
      </div>

      <header className="header">
        <label className="searchbox">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setCategory('ALL')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
            }}
            placeholder="Search for anything here..."
            aria-label="Search products"
          />
          <span aria-hidden="true">⌕</span>
        </label>

        <a className="brand" href="#home">NEXT</a>

        <div className="header-actions">
          <button aria-label="Wishlist" title="Wishlist" onClick={() => setMessage('Wishlist is not included in this academic demo yet.')}>♡</button>
          <button aria-label={currentUser ? 'My account' : 'Sign in'} title={currentUser ? 'My account' : 'Sign in'} onClick={openAccount}>
            {currentUser ? '♙' : '♙'}
            <span className="account-short-label">{currentUser ? currentUser.name.split(' ')[0] : 'Sign in'}</span>
          </button>
          <button aria-label="Shopping bag" title="Shopping bag" onClick={() => setCartOpen(true)}>
            ♧ <sup>{cartCount}</sup>
          </button>
        </div>
      </header>

      <nav className="departments" aria-label="Shop departments">
        {departments.map((item) => (
          <button
            key={item}
            className={category === item ? 'selected' : ''}
            onClick={() => {
              setCategory(item)
              setSearch('')
              document.getElementById('collection')?.scrollIntoView({ behavior: 'smooth' })
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {message && (
        <div className="message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage('')} aria-label="Dismiss">×</button>
        </div>
      )}

      <main>
        <section className="hero" id="home">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1800&q=85"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          <div className="hero-shade" />
          <div className="hero-text">
            <span>THE NEW SEASON COLLECTION</span>
            <h1>NEW SEASON,<br />NEW LAYERS</h1>
            <p>Discover fashion for every day.</p>
            <a href="#collection">SHOP THE COLLECTION →</a>
          </div>
          <span className="video-caption">NEW SEASON · NEW STYLE</span>
        </section>

        <section className="collection" id="collection">
          <div className="collection-heading">
            <div>
              <span className="section-label">DISCOVER YOUR NEXT FAVOURITE</span>
              <h2>Shop the collection</h2>
            </div>
            <span>{visibleProducts.length} products</span>
          </div>

          <div className="filter-row">
            {['ALL', 'WOMEN', 'MEN', 'BOYS', 'GIRLS', 'HOME', 'BABY'].map((item) => (
              <button
                key={item}
                className={category === item ? 'filter active' : 'filter'}
                onClick={() => {
                  setCategory(item)
                  setSearch('')
                }}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-image">
<img
  src={product.image}
  alt={product.name}
  loading="eager"
  referrerPolicy="no-referrer"
/>                  <button className="add-button" onClick={() => addToBag(product)}>ADD TO BAG +</button>
                </div>
                <p className="product-category">{product.category}</p>
                <h3>{product.name}</h3>
                <strong>{money(product.price)}</strong>
              </article>
            ))}
            {visibleProducts.length === 0 && (
              <p className="no-products">No products found. Try another search.</p>
            )}
          </div>
        </section>

        <section className="campaign">
          <span>STYLE FOR EVERYDAY LIVING</span>
          <h2>Little favourites.<br />Big everyday adventures.</h2>
          <a href="#collection">EXPLORE THE COLLECTION →</a>
        </section>
      </main>

      {cartOpen && (
        <div className="cart-backdrop" onClick={() => setCartOpen(false)}>
          <aside className="cart-panel" onClick={(event) => event.stopPropagation()}>
            <div className="cart-title">
              <h2>Your shopping bag</h2>
              <button onClick={() => setCartOpen(false)} aria-label="Close shopping bag">×</button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>Your bag is empty. Explore our collection.</p>
                <button className="back-to-shop" onClick={() => setCartOpen(false)}>CONTINUE SHOPPING</button>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <p>{money(item.price)}</p>
                      <div className="quantity">
                        <button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}>−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}>+</button>
                      </div>
                    </div>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}

                <div className="cart-total">
                  <strong>Subtotal</strong>
                  <strong>{money(cartTotal)}</strong>
                </div>
                <p className="checkout-note">Delivery charges, if any, are not included. This is an academic project demo.</p>
                <button className="place-order" onClick={openCheckout}>CONTINUE TO CHECKOUT</button>
              </>
            )}
          </aside>
        </div>
      )}

      {accountView && (
        <div className="modal-backdrop" onClick={closeAuth}>
          <section className="account-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="account-title">
            <button className="modal-close" onClick={closeAuth} aria-label="Close account window">×</button>

            {accountView === 'account' && currentUser ? (
              <>
                <span className="modal-eyebrow">STYLECART ACCOUNT</span>
                <h2 id="account-title">Hello, {currentUser.name}</h2>
                <p className="account-email">{currentUser.email}</p>
                <div className="account-section-heading">
                  <h3>Your demo orders</h3>
                  <span>{userOrders.length}</span>
                </div>
                {userOrders.length === 0 ? (
                  <p className="empty-orders">You have not placed any demo orders yet.</p>
                ) : (
                  <div className="order-history">
                    {userOrders.map((order) => (
                      <article className="order-card" key={order.id}>
                        <div className="order-card-top">
                          <strong>{order.id}</strong>
                          <span>{new Date(order.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                        <p>{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) · {money(order.total)}</p>
                        <small>{order.status} · {order.paymentMethod}</small>
                      </article>
                    ))}
                  </div>
                )}
                <button className="secondary-full-button" onClick={handleLogout}>SIGN OUT</button>
              </>
            ) : (
              <>
                <div className="auth-brandline">
                  <span className="auth-brandmark">NEXT</span>
                  <span className="auth-brand-caption">STYLECART MEMBERSHIP</span>
                </div>
                <span className="modal-eyebrow">{authMode === 'login' ? 'WELCOME BACK' : 'JOIN THE STYLECART COMMUNITY'}</span>
                <h2 id="account-title">{authMode === 'login' ? 'Sign in to your account' : 'Create your account'}</h2>
                <p className="modal-intro">{authMode === 'login' ? 'Sign in to view your account and continue to checkout.' : 'Create an account to enjoy a smoother shopping experience and keep track of your demo orders.'}</p>

                <form className="account-form" onSubmit={handleAuthSubmit}>
                  {authMode === 'signup' && (
                    <div className="auth-name-grid">
                      <label>
                        First name
                        <input type="text" value={authForm.firstName} onChange={(event) => setAuthForm((current) => ({ ...current, firstName: event.target.value }))} autoComplete="given-name" placeholder="First name" required />
                      </label>
                      <label>
                        Last name
                        <input type="text" value={authForm.lastName} onChange={(event) => setAuthForm((current) => ({ ...current, lastName: event.target.value }))} autoComplete="family-name" placeholder="Last name" required />
                      </label>
                    </div>
                  )}
                  <label>
                    Email address
                    <input type="email" value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} autoComplete="email" placeholder="you@example.com" required />
                  </label>
                  <label>
                    Password
                    <input type="password" value={authForm.password} onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} minLength={6} placeholder="At least 6 characters" required />
                  </label>
                  {authMode === 'signup' && (
                    <label>
                      Confirm password
                      <input type="password" value={authForm.confirmPassword} onChange={(event) => setAuthForm((current) => ({ ...current, confirmPassword: event.target.value }))} autoComplete="new-password" minLength={6} placeholder="Enter your password again" required />
                    </label>
                  )}
                  {authMode === 'signup' && (
                    <label className="terms-check">
                      <input type="checkbox" checked={authForm.acceptTerms} onChange={(event) => setAuthForm((current) => ({ ...current, acceptTerms: event.target.checked }))} required />
                      <span>I agree to the <strong>Terms of Use</strong> and <strong>Privacy Policy</strong>.</span>
                    </label>
                  )}
                  {authError && <p className="form-error" role="alert">{authError}</p>}
                  <button className="place-order auth-submit" type="submit" disabled={authLoading}>
                    {authLoading ? 'PLEASE WAIT...' : authMode === 'login' ? 'SIGN IN' : 'CREATE ACCOUNT'}
                  </button>
                </form>
                <p className="auth-switch">
                  {authMode === 'login' ? 'New to StyleCart?' : 'Already have an account?'}
                  <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthError('') }}>
                    {authMode === 'login' ? 'Create account' : 'Sign in'}
                  </button>
                </p>
                <p className="demo-disclaimer">Academic project demo: account details and sample orders are stored only in this browser. Do not use a real password or personal customer information.</p>
              </>
            )}
          </section>
        </div>
      )}

      {checkoutOpen && (
        <div className="modal-backdrop" onClick={() => setCheckoutOpen(false)}>
          <section className="checkout-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="checkout-title">
            <button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout">×</button>
            <span className="modal-eyebrow">ALMOST THERE</span>
            <h2 id="checkout-title">Delivery details</h2>
            <p className="modal-intro">Complete this form to place a sample Cash on Delivery order.</p>

            <form className="checkout-form" onSubmit={handleCheckoutSubmit}>
              <div className="checkout-fields">
                <label>
                  Full name
                  <input name="fullName" value={shipping.fullName} onChange={updateShipping} autoComplete="name" required />
                </label>
                <label>
                  Email address
                  <input type="email" name="email" value={shipping.email} onChange={updateShipping} autoComplete="email" required />
                </label>
                <label>
                  Phone number
                  <input type="tel" name="phone" value={shipping.phone} onChange={updateShipping} autoComplete="tel" placeholder="e.g. +44 7700 900000" required />
                </label>
                <label className="field-wide">
                  Delivery address
                  <textarea name="address" value={shipping.address} onChange={updateShipping} autoComplete="street-address" rows="3" required />
                </label>
                <label>
                  City / Town
                  <input name="city" value={shipping.city} onChange={updateShipping} autoComplete="address-level2" required />
                </label>
                <label>
                  Postcode
                  <input name="postcode" value={shipping.postcode} onChange={updateShipping} autoComplete="postal-code" required />
                </label>
              </div>

              <div className="payment-choice">
                <span>PAYMENT METHOD</span>
                <strong>Cash on Delivery (Demo)</strong>
                <small>No real payment will be collected.</small>
              </div>

              <div className="checkout-summary">
                <span>Order total</span>
                <strong>{money(cartTotal)}</strong>
              </div>
              {checkoutError && <p className="form-error" role="alert">{checkoutError}</p>}
              <button className="place-order" type="submit">PLACE DEMO ORDER</button>
              <button className="text-button" type="button" onClick={() => setCheckoutOpen(false)}>RETURN TO SHOPPING</button>
            </form>
          </section>
        </div>
      )}

      {orderConfirmation && (
        <div className="modal-backdrop" onClick={() => setOrderConfirmation(null)}>
          <section className="confirmation-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="confirmation-title">
            <div className="confirmation-check">✓</div>
            <span className="modal-eyebrow">STYLECART</span>
            <h2 id="confirmation-title">Your demo order is placed!</h2>
            <p>Thank you, {orderConfirmation.customer.fullName}. Your sample order number is:</p>
            <strong className="confirmation-order-id">{orderConfirmation.id}</strong>
            <p className="demo-disclaimer">This is an academic demonstration only. No real order has been sent to a store and no payment has been taken.</p>
            <button className="place-order" onClick={() => setOrderConfirmation(null)}>CONTINUE SHOPPING</button>
          </section>
        </div>
      )}

      <footer className="footer">
        <a className="brand" href="#home">NEXT</a>
        <p>Fashion · Home · Everyday essentials</p>
        <p>React.js E-Commerce Academic Project</p>
      </footer>
    </div>
  )
}

export default App
