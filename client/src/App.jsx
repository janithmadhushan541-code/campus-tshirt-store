import { useEffect, useMemo, useState } from 'react';
import { ShoppingBag, Search, Shirt, Menu, X, Plus, Minus, Trash2, CheckCircle2, ArrowRight, Heart, Truck, ShieldCheck, PackageCheck } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const money = (value) => `LKR ${Number(value || 0).toLocaleString('en-LK')}`;
const categories = ['All', 'Campus', 'Sports', 'Event', 'Accessories'];

export default function App() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('campus-tee-cart') || '[]'));
  const [sizes, setSizes] = useState({});
  const [quantities, setQuantities] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '', campus: 'University of Ruhuna', deliveryNote: '' });

  useEffect(() => { localStorage.setItem('campus-tee-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    const controller = new AbortController();
    async function loadProducts() {
      setLoading(true); setError('');
      try {
        const response = await fetch(`${API}/products`, { signal: controller.signal });
        if (!response.ok) throw new Error('Could not load products. Is the API running?');
        setProducts(await response.json());
      } catch (err) { if (err.name !== 'AbortError') setError(err.message); }
      finally { setLoading(false); }
    }
    loadProducts();
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => products.filter(p =>
    (category === 'All' || p.category === category) &&
    `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  ), [products, category, search]);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  function addToCart(product) {
    const size = sizes[product._id] || product.sizes?.[0] || 'M';
    const quantity = Number(quantities[product._id] || 1);
    setCart(current => {
      const existing = current.find(item => item.productId === product._id && item.size === size);
      if (existing) return current.map(item => item === existing ? { ...item, quantity: Math.min(20, item.quantity + quantity) } : item);
      return [...current, { productId: product._id, name: product.name, image: product.image, price: product.price, size, quantity }];
    });
    setCartOpen(true);
  }
  function updateQuantity(productId, size, delta) {
    setCart(current => current.map(item => item.productId === productId && item.size === size ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  }
  function removeItem(productId, size) { setCart(current => current.filter(item => !(item.productId === productId && item.size === size))); }

  async function placeOrder(event) {
    event.preventDefault(); setError('');
    try {
      const response = await fetch(`${API}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer, items: cart.map(({ productId, size, quantity }) => ({ productId, size, quantity })) })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not place your order.');
      setSuccess(data); setCart([]); setCheckoutOpen(false); setCartOpen(false);
      const refreshed = await fetch(`${API}/products`);
      if (refreshed.ok) setProducts(await refreshed.json());
    } catch (err) { setError(err.message); }
  }

  return <div className="app-shell">
    <div className="announcement">MADE FOR CAMPUS LIFE <span>✦</span> TEAM SPIRIT STARTS HERE</div>
    <header className="header">
      <a href="#" className="brand"><span className="brand-icon"><Shirt size={23}/></span><span>CAMPUS<span className="brand-light">THREADS</span><small>YOUR CAMPUS. YOUR STYLE.</small></span></a>
      <nav className="desktop-nav"><a href="#shop">Shop all</a><a href="#collections">Collections</a><a href="#about">Our story</a></nav>
      <div className="header-actions"><button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label="Open cart"><ShoppingBag size={20}/><span>Bag</span><b>{totalCount}</b></button></div>
    </header>

    <main>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span></span> CAMPUS CULTURE, WORN PROUD</div>
          <h1>Wear your<br/><em>people.</em> Own<br/>your moment.</h1>
          <p>Campus tees, sports jerseys and event gear made for the memories you make together.</p>
          <a className="primary-button" href="#shop">Find your fit <ArrowRight size={17}/></a>
          <div className="hero-note"><div className="avatar-stack"><span>J</span><span>M</span><span>K</span></div><span><strong>Made for your crew</strong><small>From batch days to big wins.</small></span></div>
        </div>
        <div className="hero-art">
          <div className="hero-image"></div><div className="image-label"><span>01 / CAMPUS COLLECTION</span><strong>Made to belong.</strong></div>
          <div className="round-stamp">CAMPUS<br/>CREW<br/><span>✳</span></div>
        </div>
        <div className="hero-bottom"><span>01 — CAMPUS</span><span>02 — SPORTS</span><span>03 — EVENTS</span><span className="scroll-label">SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section className="benefits" id="about">
        <div><Truck/><span><strong>Campus-friendly delivery</strong><small>Pick-up and delivery options</small></span></div>
        <div><ShieldCheck/><span><strong>Easy, clear ordering</strong><small>Choose your size and quantity</small></span></div>
        <div><PackageCheck/><span><strong>Made for your team</strong><small>Batch, club and event gear</small></span></div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading"><div><div className="eyebrow">THE CAMPUS EDIT</div><h2>Find your <em>uniform.</em></h2><p>Everyday essentials. Match-day energy. Memories in cotton.</p></div><span className="product-count">{filtered.length.toString().padStart(2, '0')} PRODUCTS</span></div>
        <div className="shop-tools">
          <div className="category-list" id="collections">{categories.map(c => <button key={c} className={category === c ? 'category active' : 'category'} onClick={() => setCategory(c)}>{c}</button>)}</div>
          <label className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search the collection..."/></label>
        </div>
        {error && <div className="notice error">{error}<button onClick={() => setError('')}><X size={16}/></button></div>}
        {loading ? <div className="loading">Getting the collection ready...</div> : <div className="product-grid">
          {filtered.map((product, index) => <article className="product-card" key={product._id}>
            <div className="product-image-wrap"><img src={product.image || 'https://placehold.co/600x700?text=Campus+Threads'} alt={product.name} loading="lazy"/><span className="product-tag">{product.featured ? 'CAMPUS FAVOURITE' : product.category.toUpperCase()}</span><button className="heart-button" aria-label="Save item" onClick={e => e.currentTarget.classList.toggle('liked')}><Heart size={18}/></button></div>
            <div className="product-info"><div className="product-meta"><span>{product.category}</span><span>{product.stock > 0 ? 'IN STOCK' : 'SOLD OUT'}</span></div><h3>{product.name}</h3><p>{product.description}</p><div className="product-buy"><strong>{money(product.price)}</strong><div className="quick-options"><label><span className="sr-only">Size</span><select value={sizes[product._id] || product.sizes?.[0] || 'M'} onChange={e => setSizes(s => ({ ...s, [product._id]: e.target.value }))}>{(product.sizes || ['S','M','L','XL']).map(s => <option key={s}>{s}</option>)}</select></label><button className="add-button" disabled={product.stock < 1} onClick={() => addToCart(product)}><Plus size={17}/> Add</button></div></div></div>
          </article>)}
          {filtered.length === 0 && <div className="empty-state">No products found. Try another search or category.</div>}
        </div>}
      </section>

      <section className="custom-banner"><div className="custom-symbol"><Shirt size={38}/></div><div><span className="eyebrow">GOT A CREW?</span><h2>One design. <em>Your whole team.</em></h2><p>Planning a batch trip, sports day or club event? Start with a group order idea.</p></div><a href="mailto:campusthreads@example.com?subject=Campus%20group%20order">Plan a group order <ArrowRight size={17}/></a></section>
    </main>
    <footer><a href="#" className="brand footer-brand"><span className="brand-icon"><Shirt size={20}/></span><span>CAMPUS<span className="brand-light">THREADS</span><small>YOUR CAMPUS. YOUR STYLE.</small></span></a><span>Built for campus people, by campus people.</span><span>© 2026 CAMPUS THREADS</span></footer>

    {cartOpen && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setCartOpen(false); }}><aside className="drawer"><div className="drawer-header"><div><span className="eyebrow">YOUR SELECTION</span><h2>Your bag <span>({totalCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="Close cart"><X/></button></div>
      {cart.length === 0 ? <div className="cart-empty"><ShoppingBag size={36}/><h3>Your bag is taking a break.</h3><p>Find something that feels like your campus.</p><button className="primary-button" onClick={() => { setCartOpen(false); document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' }); }}>Explore collection <ArrowRight size={16}/></button></div> : <>
        <div className="cart-items">{cart.map(item => <div className="cart-item" key={`${item.productId}-${item.size}`}><img src={item.image} alt={item.name}/><div className="cart-item-info"><h3>{item.name}</h3><span>Size: {item.size}</span><strong>{money(item.price)}</strong><div className="quantity-control"><button onClick={() => updateQuantity(item.productId, item.size, -1)}><Minus size={13}/></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.productId, item.size, 1)}><Plus size={13}/></button><button className="remove-item" onClick={() => removeItem(item.productId, item.size)}><Trash2 size={14}/></button></div></div></div>)}</div>
        <div className="cart-summary"><div><span>Subtotal</span><strong>{money(total)}</strong></div><small>Delivery or campus pick-up details can be confirmed by the team.</small><button className="primary-button full-button" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Continue to checkout <ArrowRight size={17}/></button></div>
      </>}
    </aside></div>}

    {checkoutOpen && <div className="overlay checkout-overlay"><section className="checkout-modal"><div className="drawer-header"><div><span className="eyebrow">ALMOST YOURS</span><h2>Checkout</h2></div><button className="icon-button" onClick={() => setCheckoutOpen(false)} aria-label="Close checkout"><X/></button></div><p className="checkout-intro">Add your details so your campus order can find its way to you.</p>
      <form onSubmit={placeOrder} className="checkout-form"><label>Full name<input required value={customer.name} onChange={e => setCustomer({...customer, name:e.target.value})} placeholder="Your name"/></label><label>University email<input required type="email" value={customer.email} onChange={e => setCustomer({...customer, email:e.target.value})} placeholder="you@university.edu"/></label><label>Phone number<input required type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone:e.target.value})} placeholder="07X XXX XXXX"/></label><label>Campus / collection point<input required value={customer.campus} onChange={e => setCustomer({...customer, campus:e.target.value})} placeholder="Campus or pick-up point"/></label><label className="wide-field">Order note (optional)<textarea value={customer.deliveryNote} onChange={e => setCustomer({...customer, deliveryNote:e.target.value})} placeholder="Faculty, batch, event, or delivery notes"/></label><div className="checkout-total"><span>Order total</span><strong>{money(total)}</strong></div>{error && <div className="notice error">{error}</div>}<button className="primary-button full-button" type="submit">Place order <ArrowRight size={17}/></button><small className="privacy-note">Demo checkout only — no online payment is collected.</small></form>
    </section></div>}

    {success && <div className="success-toast"><CheckCircle2 size={22}/><div><strong>Order placed!</strong><span>Order ID: {success.orderId}</span><small>Total: {money(success.total)} · Status: {success.status}</small></div><button onClick={() => setSuccess(null)}><X size={16}/></button></div>}
  </div>;
}
