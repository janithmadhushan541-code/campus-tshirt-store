import { useEffect, useState } from 'react';
import { ArrowLeft, ClipboardList, LayoutDashboard, LogOut, Package, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import './admin.css';
import { API_BASE_URL } from './api.js';

const statuses = ['Pending', 'Confirmed', 'Printing', 'Ready', 'Delivered', 'Cancelled'];
const categories = ['Campus', 'Sports', 'Event', 'Accessories'];
const currency = new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' });
const money = value => currency.format(value);
const emptyProduct = { name: '', description: '', category: 'Campus', image: '', sizes: 'S, M, L, XL', stock: '', price: '', featured: false };

async function request(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}/admin${path}`, {
    method: options.method,
    signal: options.signal,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(options.body && { 'Content-Type': 'application/json' })
    },
    body: options.body && JSON.stringify(options.body)
  });
  if (response.status === 204) return;
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(data.message || 'Something went wrong.'), { status: response.status });
  return data;
}

export default function Admin() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [view, setView] = useState('Overview');
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  const path = view === 'Orders'
    ? `/orders?${new URLSearchParams({ search: query, status, page })}`
    : `/${view.toLowerCase()}`;

  function clearSession() {
    setToken('');
    setSelected(null);
    setEditing(null);
    setData(null);
    setMessage('');
  }

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setLoading(true);
    request(path, token, { signal: controller.signal })
      .then(result => {
        if (!controller.signal.aborted) setData({ path, result });
      })
      .catch(err => {
        if (controller.signal.aborted) return;
        if (err.status === 401) clearSession();
        setError(err.message);
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token, path, revision]);

  async function perform(action) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await action();
    } catch (err) {
      if (token && err.status === 401) clearSession();
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function refresh() {
    setRevision(value => value + 1);
  }

  function navigate(next) {
    setView(next);
    setEditing(null);
    setSelected(null);
    setError('');
    setMessage('');
  }

  if (!token) return <main className="admin-login">
    <form className="admin-panel admin-login-card" onSubmit={event => {
      event.preventDefault();
      perform(async () => {
        const session = await request('/login', null, { method: 'POST', body: { password } });
        setPassword('');
        setToken(session.token);
      });
    }}>
      <a href="/" className="admin-back"><ArrowLeft size={16}/> Back to store</a>
      <div className="admin-mark"><ShieldCheck size={25}/></div>
      <span className="admin-eyebrow">CAMPUS THREADS</span>
      <h1>Admin sign in</h1>
      <p>Manage the store’s orders and product catalogue.</p>
      <label>Admin password<input type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)}/></label>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      <button className="admin-primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
  </main>;

  const current = data?.path === path ? data.result : null;
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/admin"><span className="admin-mark"><ShieldCheck size={23}/></span><span>Campus Threads<small>Store administration</small></span></a>
      <nav aria-label="Admin navigation">
        {[[LayoutDashboard, 'Overview'], [ClipboardList, 'Orders'], [Package, 'Products']].map(([Icon, label]) =>
          <button key={label} disabled={busy} aria-current={view === label ? 'page' : undefined} onClick={() => navigate(label)}><Icon size={18}/>{label}</button>)}
      </nav>
      <a className="admin-back" href="/"><ArrowLeft size={16}/> View storefront</a>
      <button className="admin-logout" disabled={busy} onClick={() => perform(async () => {
        await request('/logout', token, { method: 'POST' });
        clearSession();
      })}><LogOut size={16}/> Sign out</button>
    </aside>

    <main className="admin-main">
      <header className="admin-heading">
        <div><span className="admin-eyebrow">STORE OPERATIONS</span><h1>{view}</h1>
          <p>{{ Overview: 'A snapshot of your store activity and inventory.', Orders: 'Find orders, review customer details and update fulfilment.', Products: 'Manage your catalogue, prices and available stock.' }[view]}</p></div>
        <div className="admin-actions"><button disabled={loading || busy} onClick={() => {
          setError(''); setSelected(null); setEditing(null); refresh();
        }}><RefreshCw size={16}/> Refresh</button>
          {view === 'Products' && <button className="admin-primary" disabled={busy} onClick={() => setEditing(emptyProduct)}><Plus size={17}/> Add product</button>}</div>
      </header>
      {error && <p className="admin-alert" role="alert">{error}</p>}
      {message && <p className="admin-success" role="status">{message}</p>}
      {loading && <p className="admin-muted" role="status">Loading…</p>}

      {view === 'Overview' && current && <div className="admin-metrics">
        {[
          ['Total orders', current.orders, 'Across all statuses'],
          ['Pending orders', current.pending, 'Awaiting confirmation'],
          ['Delivered order value', money(current.deliveredValue), 'Total value of delivered orders'],
          ['Low stock', current.lowStock, `${current.stockLimit} units or fewer · ${current.products} products total`]
        ].map(([label, value, detail]) => <section className="admin-panel admin-metric" key={label}>
          <h2>{label}</h2><strong>{value}</strong><p>{detail}</p>
        </section>)}
      </div>}

      {view === 'Orders' && <>
        <form className="admin-panel admin-filters" onSubmit={event => {
          event.preventDefault(); setPage(1); setQuery(search.trim()); setSelected(null);
        }}>
          <label>Search orders<input type="search" placeholder="Order ID, name or email" value={search} onChange={event => setSearch(event.target.value)}/></label>
          <label>Status<select value={status} onChange={event => {
            setStatus(event.target.value); setPage(1); setSelected(null);
          }}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select></label>
          <button className="admin-primary">Search</button>
        </form>

        {selected && <OrderDetail key={selected._id} order={selected} busy={busy} close={() => setSelected(null)} save={status => perform(async () => {
          const updated = await request(`/orders/${selected._id}`, token, { method: 'PATCH', body: { status, previousStatus: selected.status } });
          setSelected(updated); setMessage('Order status updated.'); refresh();
        })}/>}

        {current && <section className="admin-panel">
          <div className="admin-table-wrap"><table><thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th><th>Details</th></tr></thead>
            <tbody>{current.orders.map(order => <tr key={order._id}>
              <td className="admin-id">#{order._id.slice(-8).toUpperCase()}</td>
              <td>{order.customer.name}</td><td>{new Date(order.createdAt).toLocaleDateString('en-LK')}</td>
              <td>{money(order.total)}</td><td><span className="admin-badge" data-status={order.status}>{order.status}</span></td>
              <td><button disabled={busy} onClick={() => setSelected(order)}>View order</button></td>
            </tr>)}</tbody></table></div>
          {current.orders.length === 0 && <p className="admin-empty">No orders match these filters.</p>}
          <div className="admin-pagination"><span>{current.count} orders · Page {current.page} of {current.pages}</span>
            <div className="admin-actions"><button disabled={loading || current.page === 1} onClick={() => setPage(current.page - 1)}>Previous</button>
              <button disabled={loading || current.page === current.pages} onClick={() => setPage(current.page + 1)}>Next</button></div></div>
        </section>}

      </>}

      {view === 'Products' && <>
        {editing && <ProductEditor key={editing._id || 'new'} product={editing} busy={busy} close={() => setEditing(null)} save={product => perform(async () => {
          await request(editing._id ? `/products/${editing._id}` : '/products', token, {
            method: editing._id ? 'PATCH' : 'POST', body: { ...product, previousStock: editing.stock, previousUpdate: editing.updatedAt }
          });
          setEditing(null); setMessage(editing._id ? 'Product updated.' : 'Product added.'); refresh();
        })}/>}
        {current && <section className="admin-panel">
          <div className="admin-table-wrap"><table><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Action</th></tr></thead>
            <tbody>{current.map(product => <tr key={product._id}><td><strong>{product.name}</strong></td><td>{product.category}</td>
              <td>{money(product.price)}</td><td><span className="admin-badge" data-status={product.stock <= 5 ? 'Pending' : 'Ready'}>{product.stock} units</span></td>
              <td><button disabled={busy} onClick={() => setEditing(product)}>Edit</button></td></tr>)}</tbody></table></div>
          {current.length === 0 && <p className="admin-empty">No products yet. Add your first product.</p>}
        </section>}
      </>}
    </main>
  </div>;
}

function OrderDetail({ order, busy, close, save }) {
  const [status, setStatus] = useState(order.status);
  const { name, email, phone, campus, deliveryNote } = order.customer;
  return <section className="admin-panel admin-detail" aria-label="Order details">
    <header><div><h2>Order details</h2><p className="admin-id">{order._id}</p></div><button disabled={busy} onClick={close}>Close</button></header>
    <dl className="admin-detail-grid">
      {Object.entries({ Customer: name, Email: email, Phone: phone, 'Collection point': campus, Notes: deliveryNote || 'None' })
        .map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <ul>{order.items.map(item => <li key={item._id}>{item.name} · {item.size} × {item.quantity} · {money(item.unitPrice * item.quantity)}</li>)}</ul>
    <form className="admin-filters" onSubmit={event => { event.preventDefault(); save(status); }}>
      <label>Order status<select value={status} onChange={event => setStatus(event.target.value)}>
        {statuses.map(value => <option key={value}>{value}</option>)}</select></label>
      <button className="admin-primary" disabled={busy || status === order.status}>Save status</button>
    </form>
  </section>;
}

function ProductEditor({ product, busy, close, save }) {
  const [draft, setDraft] = useState({ ...product, sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes });
  const field = name => ({ value: draft[name], onChange: event => setDraft({ ...draft, [name]: event.target.value }) });
  return <form className="admin-panel admin-detail" onSubmit={event => {
    event.preventDefault();
    const { name, category, description, image, sizes, stock, price, featured } = draft;
    save({ name, category, description, image: image.trim(), sizes: sizes.split(',').map(size => size.trim()).filter(Boolean),
      stock: Number(stock), price: Number(price), featured });
  }}>
    <header><h2>{product._id ? 'Edit product' : 'New product'}</h2><button type="button" disabled={busy} onClick={close}>Close</button></header>
    <div className="admin-editor">
      <label>Product name<input required maxLength={120} {...field('name')}/></label>
      <label>Category<select {...field('category')}>{categories.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Price (LKR)<input required type="number" min="0" step="0.01" {...field('price')}/></label>
      <label>Stock<input required type="number" min="0" step="1" {...field('stock')}/></label>
      <label>Sizes (comma-separated)<input required {...field('sizes')}/></label>
      <label>Image URL<input type="url" maxLength={2048} {...field('image')}/></label>
      <label className="admin-wide">Description<textarea rows="3" maxLength={2000} {...field('description')}/></label>
      <label className="admin-check"><input type="checkbox" checked={draft.featured} onChange={event => setDraft({ ...draft, featured: event.target.checked })}/> Featured product</label>
    </div>
    <button className="admin-primary" disabled={busy}>{busy ? 'Saving…' : 'Save product'}</button>
  </form>;
}
