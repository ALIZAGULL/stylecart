
import { useState } from 'react'
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

const money = (amount) =>
  new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount)

function App() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [message, setMessage] = useState('')

  const visibleProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(search.toLowerCase()) ||
      product.category.toLowerCase().includes(search.toLowerCase())

    const matchesCategory =
      category === 'ALL' || product.category === category

    return matchesSearch && matchesCategory
  })

  const addToBag = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { ...product, quantity: 1 }]
    })

    setMessage(`${product.name} added to your bag`)
  }

  const updateQuantity = (id, change) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + change }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

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
            placeholder="Search for anything here..."
            aria-label="Search products"
          />
          <span>⌕</span>
        </label>

        <a className="brand" href="#home">NEXT</a>

        <div className="header-actions">
          <button
            aria-label="Wishlist"
            onClick={() => setMessage('Wishlist feature can be added next.')}
          >
            ♡
          </button>
          <button
            aria-label="Account"
            onClick={() => setMessage('Account feature can be added next.')}
          >
            ♙
          </button>
          <button
            aria-label="Shopping bag"
            onClick={() => setCartOpen(true)}
          >
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
              document.getElementById('collection')?.scrollIntoView({
                behavior: 'smooth',
              })
            }}
          >
            {item}
          </button>
        ))}
      </nav>

      {message && (
        <div className="message" role="status">
          <span>{message}</span>
          <button onClick={() => setMessage('')} aria-label="Dismiss">
            ×
          </button>
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
            {['ALL', 'WOMEN', 'MEN', 'BOYS', 'GIRLS', 'HOME', 'BABY'].map(
              (item) => (
                <button
                  key={item}
                  className={category === item ? 'filter active' : 'filter'}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              )
            )}
          </div>

          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product" key={product.id}>
                <div className="product-image">
                  <img
                    src={product.image}
                    alt={product.name}
                    loading="lazy"
                  />
                  <button
                    className="add-button"
                    onClick={() => addToBag(product)}
                  >
                    ADD TO BAG +
                  </button>
                </div>

                <p className="product-category">{product.category}</p>
                <h3>{product.name}</h3>
                <strong>{money(product.price)}</strong>
              </article>
            ))}

            {visibleProducts.length === 0 && (
              <p>No products found. Try another search.</p>
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
          <aside
            className="cart-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-title">
              <h2>Your shopping bag</h2>
              <button onClick={() => setCartOpen(false)}>×</button>
            </div>

            {cart.length === 0 ? (
              <p>Your bag is empty. Explore our collection.</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-info">
                      <strong>{item.name}</strong>
                      <p>{money(item.price)}</p>
                      <div className="quantity">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <strong>{money(item.price * item.quantity)}</strong>
                  </div>
                ))}

                <div className="cart-total">
                  <strong>Subtotal</strong>
                  <strong>{money(cartTotal)}</strong>
                </div>

                <p className="checkout-note">
                  Demo checkout. No real payment will be taken.
                </p>

                <button
                  className="place-order"
                  onClick={() =>
                    setMessage('Demo order only. No order has been submitted.')
                  }
                >
                  CONTINUE TO CHECKOUT
                </button>
              </>
            )}
          </aside>
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

