
import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  Search, ShoppingBag, Heart, Menu, ArrowRight, X, Plus, Minus, Trash2
} from "lucide-react";
import "./storefront.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const euro = value =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(Number(value || 0));

export default function Storefront() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .gt("stock", 0)
        .order("created_at", { ascending: false });

      if (!error) setProducts(data || []);
    }

    loadProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    `${product.name} ${product.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function addToCart(product) {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);

      if (existing) {
        return current.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  }

  function changeQuantity(productId, amount) {
    setCart(current =>
      current
        .map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  }

  function removeFromCart(productId) {
    setCart(current => current.filter(item => item.id !== productId));
  }

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const cartTotal = cart.reduce(
    (total, item) =>
      total + Number(item.sale_price || 0) * item.quantity,
    0
  );

  return (
    <div className="store">
      <div className="store-announcement">
        CAVEROOM — YOUR SPACE. YOUR STYLE.
      </div>

      <header className="store-header">
        <button
          className="mobile-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menü öffnen"
        >
          <Menu />
        </button>

        <a className="store-logo" href="#">
          CAVEROOM
        </a>

        <nav className={menuOpen ? "store-nav open" : "store-nav"}>
          <a href="#new">NEW IN</a>
          <a href="#shop">CLOTHING</a>
          <a href="#shop">SHOES</a>
          <a href="#shop">ACCESSORIES</a>
          <a href="#brands">BRANDS</a>
        </nav>

        <div className="store-actions">
          <label className="store-search">
            <Search size={18} />
            <input
              placeholder="Suchen"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </label>

          <button
            aria-label="Warenkorb"
            className="cart-button"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingBag size={21} />
            <span>{cartCount}</span>
          </button>
        </div>
      </header>

      {cartOpen && (
        <div
          className="cart-overlay"
          onClick={() => setCartOpen(false)}
        >
          <aside
            className="cart-drawer"
            onClick={e => e.stopPropagation()}
          >
            <div className="cart-heading">
              <div>
                <p>YOUR SELECTION</p>
                <h2>Warenkorb ({cartCount})</h2>
              </div>
              <button
                className="cart-close"
                onClick={() => setCartOpen(false)}
                aria-label="Warenkorb schließen"
              >
                <X />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={35} />
                <h3>DEIN WARENKORB IST LEER</h3>
                <p>Entdecke unsere ausgewählten Fashion-Pieces.</p>
                <button onClick={() => setCartOpen(false)}>
                  WEITER SHOPPEN
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map(item => (
                    <article className="cart-item" key={item.id}>
                      <img
                        src={
                          item.image_url ||
                          "https://placehold.co/150x180?text=CAVEROOM"
                        }
                        alt={item.name}
                      />

                      <div className="cart-item-info">
                        <span>{item.category}</span>
                        <h3>{item.name}</h3>
                        <strong>{euro(item.sale_price)}</strong>

                        <div className="cart-quantity">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label="Menge verringern"
                          >
                            <Minus size={14} />
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label="Menge erhöhen"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      <button
                        className="cart-remove"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Produkt entfernen"
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  ))}
                </div>

                <div className="cart-summary">
                  <div>
                    <span>Zwischensumme</span>
                    <strong>{euro(cartTotal)}</strong>
                  </div>
                  <p>Versandkosten werden im nächsten Schritt berechnet.</p>
                  <button
                    className="cart-checkout"
                    onClick={() => {
                      setCartOpen(false);
                      setCheckoutOpen(true);
                    }}
                  >
                    ZUR KASSE <ArrowRight size={17} />
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutOpen && (
        <div className="cart-overlay">
          <section className="cart-drawer checkout-drawer">
            <div className="cart-heading">
              <div>
                <p>CAVEROOM CHECKOUT</p>
                <h2>Deine Bestellung</h2>
              </div>
              <button
                className="cart-close"
                onClick={() => setCheckoutOpen(false)}
                aria-label="Checkout schließen"
              >
                <X />
              </button>
            </div>

            <form
              className="checkout-form"
              onSubmit={e => e.preventDefault()}
            >
              <h3>Kontaktinformationen</h3>

              <label>
                E-Mail-Adresse
                <input
                  type="email"
                  placeholder="deine@email.de"
                  required
                />
              </label>

              <h3>Lieferadresse</h3>

              <div className="checkout-name-fields">
                <label>
                  Vorname
                  <input type="text" required />
                </label>

                <label>
                  Nachname
                  <input type="text" required />
                </label>
              </div>

              <label>
                Straße und Hausnummer
                <input type="text" required />
              </label>

              <div className="checkout-name-fields">
                <label>
                  Postleitzahl
                  <input type="text" required />
                </label>

                <label>
                  Stadt
                  <input type="text" required />
                </label>
              </div>

              <label>
                Land
                <select defaultValue="Deutschland" required>
                  <option>Deutschland</option>
                  <option>Österreich</option>
                  <option>Schweiz</option>
                </select>
              </label>

              <div className="checkout-order">
                <h3>Deine Artikel</h3>

                {cart.map(item => (
                  <div className="checkout-order-item" key={item.id}>
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <strong>
                      {euro(Number(item.sale_price || 0) * item.quantity)}
                    </strong>
                  </div>
                ))}

                <div className="checkout-total">
                  <span>Zwischensumme</span>
                  <strong>{euro(cartTotal)}</strong>
                </div>
              </div>

              <p className="checkout-notice">
                Versandkosten und Zahlungsmöglichkeiten werden im nächsten
                Schritt ergänzt.
              </p>

              <button
                type="submit"
                className="cart-checkout"
                disabled={cart.length === 0}
              >
                BESTELLUNG ÜBERPRÜFEN
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                className="checkout-back"
                onClick={() => {
                  setCheckoutOpen(false);
                  setCartOpen(true);
                }}
              >
                ZURÜCK ZUM WARENKORB
              </button>
            </form>
          </section>
        </div>
      )}

      <main>
        <section className="store-hero">
          <div className="hero-content">
            <p>THE NEW STANDARD</p>
            <h1>YOUR SPACE.<br />YOUR STYLE.</h1>
            <span>
              Entdecke ausgewählte Fashion-Pieces und
              finde deinen eigenen Style.
            </span>
            <a href="#shop" className="hero-button">
              JETZT ENTDECKEN <ArrowRight size={17} />
            </a>
          </div>
          <div className="hero-side-text">CAVEROOM — EST. 2026</div>
        </section>

        <section className="store-intro">
          <p>CURATED FOR YOUR STYLE</p>
          <h2>MORE THAN JUST FASHION.</h2>
          <span>
            Ausgewählte Pieces. Starke Marken. Dein eigener Look.
          </span>
        </section>

        <section className="store-products" id="new">
          <div className="section-heading">
            <div>
              <p>FRESH DROPS</p>
              <h2>NEW ARRIVALS</h2>
            </div>
            <span>{filteredProducts.length} PRODUCTS</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="store-empty">
              <ShoppingBag size={30} />
              <h3>COMING SOON</h3>
              <p>
                Unsere ersten Pieces werden gerade vorbereitet.
                Schau bald wieder vorbei.
              </p>
            </div>
          ) : (
            <div className="store-grid" id="shop">
              {filteredProducts.map(product => (
                <article className="store-product" key={product.id}>
                  <div className="product-image">
                    <img
                      src={
                        product.image_url ||
                        "https://placehold.co/600x750?text=CAVEROOM"
                      }
                      alt={product.name}
                    />
                    <button
                      className="product-heart"
                      aria-label="Merken"
                    >
                      <Heart size={19} />
                    </button>
                    <button
                      className="quick-add"
                      onClick={() => addToCart(product)}
                    >
                      ADD TO BAG <ArrowRight size={15} />
                    </button>
                  </div>

                  <div className="store-product-info">
                    <span>{product.category}</span>
                    <h3>{product.name}</h3>
                    <strong>{euro(product.sale_price)}</strong>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="brand-section" id="brands">
          <p>THE BRANDS</p>
          <h2>BUILT AROUND STYLE.</h2>
          <div className="brand-names">
            <span>NIKE</span>
            <span>ADIDAS</span>
            <span>NEW BALANCE</span>
            <span>ESSENTIALS</span>
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <div className="footer-top">
          <div>
            <h2>CAVEROOM</h2>
            <p>YOUR SPACE. YOUR STYLE.</p>
          </div>
          <a href="mailto:info@caveroom.de">CONTACT</a>
        </div>

        <div className="footer-bottom">
          <span>© 2026 CAVEROOM</span>
          <span>MADE FOR YOUR STYLE.</span>
        </div>
      </footer>
    </div>
  );
}
