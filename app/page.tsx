"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  brand: string;
  type: string;
  price: number;
  oldPrice?: number;
  stock: number;
  image: string;
  badge?: string;
  adult?: boolean;
  description: string;
};

type CartItem = Product & { quantity: number; giftWrap?: boolean };

const WHATSAPP = "5598984447708";

const products: Product[] = [
  { id: 1, name: "Aura Élégance", category: "Perfumes femininos", brand: "Andora Selection", type: "Eau de Parfum", price: 189.9, oldPrice: 229.9, stock: 12, badge: "Mais vendido", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=86", description: "Floral âmbar elegante, com saída luminosa e fundo envolvente." },
  { id: 2, name: "Noble Intense", category: "Perfumes masculinos", brand: "Andora Selection", type: "Eau de Parfum", price: 219.9, stock: 7, badge: "Lançamento", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=86", description: "Madeiras nobres, especiarias quentes e assinatura marcante." },
  { id: 3, name: "Maison Dorée", category: "Perfumes importados", brand: "Maison", type: "Importado", price: 349.9, stock: 4, badge: "Exclusivo", image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=86", description: "Uma fragrância sofisticada para ocasiões inesquecíveis." },
  { id: 4, name: "Essência 214", category: "Contratipos", brand: "Essencial", type: "Contratipo", price: 79.9, stock: 18, badge: "Favorito", image: "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?auto=format&fit=crop&w=900&q=86", description: "Alta fixação e personalidade, inspirada em grandes clássicos." },
  { id: 5, name: "Caixa Cacau Nobre", category: "Chocolates", brand: "Cacau Nobre", type: "Chocolate fino", price: 69.9, stock: 20, badge: "Presenteável", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=86", description: "Seleção de bombons finos em embalagem especial." },
  { id: 6, name: "Ritual de Carinho", category: "Kits presente", brand: "Andora", type: "Kit", price: 159.9, oldPrice: 179.9, stock: 8, badge: "Kit especial", image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=86", description: "Perfume, chocolate fino, cartão e embalagem premium." },
  { id: 7, name: "Velvet Body Cream", category: "Cosméticos", brand: "Andora Beauty", type: "Hidratante", price: 54.9, stock: 15, image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=86", description: "Textura aveludada, fragrância delicada e hidratação profunda." },
  { id: 8, name: "Noir Privé", category: "Produtos Especiais", brand: "Linha Íntima", type: "Bem-estar", price: 119.9, stock: 9, adult: true, badge: "+18", image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80", description: "Item de bem-estar íntimo em embalagem reservada e envio discreto." },
];

const categories = ["Todos", "Perfumes femininos", "Perfumes masculinos", "Perfumes importados", "Contratipos", "Chocolates", "Kits presente", "Cosméticos", "Produtos Especiais"];

const neighborhoods: Record<string, number> = {
  "Centro": 5,
  "Bairro Novo": 7,
  "Portelinha": 8,
  "Outro bairro": 10,
  "Retirada na loja": 0,
};

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    bag: <><path d="M6 8h12l1 13H5L6 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    x: <path d="M5 5l14 14M19 5 5 19"/>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5"/>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    whatsapp: <><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l1.8-5.3A8.5 8.5 0 1 1 21 11.5Z"/><path d="M8.3 8.2c.6 3.6 2.7 5.7 6.4 6.4"/></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z"/><circle cx="7" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></>,
    star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9L12 3Z"/>,
    gift: <><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M12 9v12M3 13h18M8.5 9C5 9 5 4 8 4c2 0 4 5 4 5M15.5 9C19 9 19 4 16 4c-2 0-4 5-4 5"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [ageGate, setAgeGate] = useState(false);
  const [adultAllowed, setAdultAllowed] = useState(false);
  const [category, setCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [maxPrice, setMaxPrice] = useState(400);
  const [promoOnly, setPromoOnly] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [toast, setToast] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [delivery, setDelivery] = useState("Centro");
  const [giftMessage, setGiftMessage] = useState("");
  const [adminTab, setAdminTab] = useState("Visão geral");

  useEffect(() => {
    const saved = localStorage.getItem("andora-cart");
    if (saved) setCart(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("andora-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesCategory = category === "Todos" || product.category === category;
    const matchesSearch = `${product.name} ${product.brand}`.toLowerCase().includes(search.toLowerCase());
    const matchesPrice = product.price <= maxPrice;
    const matchesPromo = !promoOnly || Boolean(product.oldPrice);
    const adultVisible = !product.adult || adultAllowed;
    return matchesCategory && matchesSearch && matchesPrice && matchesPromo && adultVisible;
  }), [category, search, maxPrice, promoOnly, adultAllowed]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity + (item.giftWrap ? 9.9 * item.quantity : 0), 0);
  const deliveryFee = neighborhoods[delivery] ?? 0;
  const total = subtotal + deliveryFee;

  function addToCart(product: Product) {
    setCart((current) => {
      const exists = current.find((item) => item.id === product.id);
      return exists
        ? current.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) } : item)
        : [...current, { ...product, quantity: 1 }];
    });
    setToast(`${product.name} foi para sua sacola`);
  }

  function updateQuantity(id: number, amount: number) {
    setCart((current) => current.map((item) => item.id === id ? { ...item, quantity: item.quantity + amount } : item).filter((item) => item.quantity > 0));
  }

  function openAdult() {
    if (adultAllowed) {
      setCategory("Produtos Especiais");
      setCatalogOpen(true);
    } else setAgeGate(true);
  }

  function confirmAdult() {
    setAdultAllowed(true);
    setAgeGate(false);
    setCategory("Produtos Especiais");
    setCatalogOpen(true);
  }

  function finishOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const number = `AE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderNumber(number);
    const summary = cart.map((item) => `${item.quantity}x ${item.name}`).join(", ");
    const message = `Olá, Andora Essence! Pedido ${number}: ${summary}. Total: ${money(total)}. Cliente: ${form.get("name")}. Entrega: ${delivery}.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function scrollTo(id: string) {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pixCode = `00020126360014BR.GOV.BCB.PIX0114+5598984447708520400005303986540${total.toFixed(2)}5802BR5922ANDORA ESSENCE6009PEDRO ROSARIO62070503***6304`;

  return (
    <main>
      <div className="topbar">Entrega em Pedro do Rosário • Primeira compra: use <strong>BEMVINDA10</strong></div>
      <header className="header">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <button className="brand" onClick={() => scrollTo("inicio")} aria-label="Andora Essence - início">
          <img src="/assets/andora-logo.png" alt="Andora Essence" />
        </button>
        <nav>
          <button onClick={() => scrollTo("inicio")}>Início</button>
          <button onClick={() => { setCategory("Todos"); setCatalogOpen(true); }}>Loja</button>
          <button onClick={() => scrollTo("presentes")}>Presentes</button>
          <button onClick={openAdult}>Produtos especiais</button>
          <button onClick={() => scrollTo("sobre")}>Nossa essência</button>
        </nav>
        <div className="header-actions">
          <button className="icon-button desktop-search" onClick={() => setCatalogOpen(true)} aria-label="Buscar"><Icon name="search" /></button>
          <button className="icon-button" onClick={() => setAccountOpen(true)} aria-label="Minha conta"><Icon name="user" /></button>
          <button className="icon-button cart-button" onClick={() => setCartOpen(true)} aria-label="Sacola"><Icon name="bag" /><span>{cartCount}</span></button>
        </div>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-glow" />
        <div className="hero-copy reveal">
          <span className="eyebrow">Perfumaria • presentes • experiências</span>
          <h1>O segredo da pele,<br/><em>a arte de presentear.</em></h1>
          <p>Fragrâncias que marcam, chocolates que acolhem e presentes preparados com carinho em cada detalhe.</p>
          <div className="hero-actions">
            <button className="button primary" onClick={() => setCatalogOpen(true)}>Descobrir a coleção <Icon name="arrow" /></button>
            <a className="button ghost" href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noreferrer"><Icon name="whatsapp" /> Falar com uma consultora</a>
          </div>
          <div className="hero-proof">
            <div><strong>Curadoria</strong><span>perfumes selecionados</span></div>
            <div><strong>Presente pronto</strong><span>embalagem impecável</span></div>
            <div><strong>Entrega local</strong><span>Pedro do Rosário</span></div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-image-wrap"><img src="/assets/fundadora-perfume.jpeg" alt="Consultora Andora Essence apresentando uma fragrância" /></div>
          <div className="floating-note">
            <span>Escolha com confiança</span>
            <strong>Consultoria personalizada</strong>
            <p>Conte o estilo da pessoa. A gente encontra o presente perfeito.</p>
          </div>
        </div>
        <div className="scroll-label">ROLE PARA DESCOBRIR <span /></div>
      </section>

      <section className="benefits">
        <div><Icon name="gift" /><span><strong>Embalagem premium</strong>Pronto para surpreender</span></div>
        <div><Icon name="truck" /><span><strong>Entrega combinada</strong>Taxa por localidade</span></div>
        <div><Icon name="star" /><span><strong>Clube Andora</strong>Carinho que vira benefícios</span></div>
        <div><Icon name="whatsapp" /><span><strong>Atendimento humano</strong>Escolha pelo WhatsApp</span></div>
      </section>

      <section className="section collection" id="colecao">
        <div className="section-heading">
          <div><span className="eyebrow">Curadoria Andora</span><h2>Queridinhos da essência</h2></div>
          <button className="text-link" onClick={() => setCatalogOpen(true)}>Ver catálogo completo <Icon name="arrow" /></button>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={() => setFavorites((f) => f.includes(product.id) ? f.filter((id) => id !== product.id) : [...f, product.id])} onAdd={() => addToCart(product)} />
          ))}
        </div>
      </section>

      <section className="editorial-section">
        <div className="editorial-image"><img src="/assets/loja-perfume.jpeg" alt="Andora Essence em Pedro do Rosário" /></div>
        <div className="editorial-copy">
          <span className="eyebrow">Lançamentos</span>
          <h2>Presença que fica<br/>depois que você passa.</h2>
          <p>Conheça fragrâncias com alta fixação, assinatura sofisticada e personalidade para todos os momentos.</p>
          <button className="button dark" onClick={() => { setCategory("Perfumes importados"); setCatalogOpen(true); }}>Explorar novidades <Icon name="arrow" /></button>
        </div>
      </section>

      <section className="section gifts" id="presentes">
        <div className="center-heading"><span className="eyebrow">Feito para emocionar</span><h2>Um presente. Uma memória.</h2><p>Monte uma experiência completa com fragrância, chocolate, embalagem e mensagem personalizada.</p></div>
        <div className="gift-layout">
          <article className="gift-card large">
            <img src="https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=1200&q=86" alt="Presente sofisticado" />
            <div><span>Datas especiais</span><h3>Presentes que falam por você</h3><button onClick={() => { setCategory("Kits presente"); setCatalogOpen(true); }}>Escolher presente <Icon name="arrow" /></button></div>
          </article>
          <article className="gift-card">
            <img src="https://images.unsplash.com/photo-1548907040-4d42eba3863e?auto=format&fit=crop&w=900&q=86" alt="Chocolates finos" />
            <div><span>Doce carinho</span><h3>Chocolates finos</h3><button onClick={() => { setCategory("Chocolates"); setCatalogOpen(true); }}>Descobrir <Icon name="arrow" /></button></div>
          </article>
          <article className="gift-card dark-card">
            <div className="abstract-rose">A</div>
            <div><span>Monte do seu jeito</span><h3>Perfume + chocolate + embalagem</h3><button onClick={() => { setCategory("Kits presente"); setCatalogOpen(true); }}>Criar meu kit <Icon name="arrow" /></button></div>
          </article>
        </div>
      </section>

      <section className="adult-teaser">
        <div className="adult-pattern" />
        <div>
          <span className="eyebrow light">Experiência reservada</span>
          <h2>Produtos especiais,<br/><em>para momentos só seus.</em></h2>
          <p>Uma curadoria discreta de bem-estar e intimidade, com atendimento reservado e embalagem sem identificação.</p>
          <button className="button rose" onClick={openAdult}><Icon name="lock" /> Acessar área +18</button>
        </div>
        <div className="privacy-seal"><Icon name="lock" size={28}/><strong>Privacidade em primeiro lugar</strong><span>Navegação e entrega discretas</span></div>
      </section>

      <section className="section about" id="sobre">
        <div className="about-copy">
          <span className="eyebrow">Nossa essência</span>
          <h2>Carinho em forma<br/>de perfume.</h2>
          <p>A Andora Essence nasceu em Pedro do Rosário para transformar escolhas em experiências marcantes. Aqui, cada fragrância é apresentada com atenção, cada presente é preparado com cuidado e cada cliente é recebido de forma única.</p>
          <div className="signature">Andora <span>Essence</span></div>
          <button className="text-link" onClick={() => setAccountOpen(true)}>Conheça o Clube Andora <Icon name="arrow" /></button>
        </div>
        <div className="about-image"><img src="/assets/fundadora-retrato.jpeg" alt="Fundadora da Andora Essence" /></div>
        <div className="quote-card"><span>“</span><p>A fragrância certa não apenas completa o look. Ela revela uma história.</p></div>
      </section>

      <section className="reviews">
        <div className="center-heading"><span className="eyebrow">Quem viveu, sentiu</span><h2>Amor em cada detalhe</h2></div>
        <div className="review-grid">
          {[
            ["O presente chegou lindo, cheiroso e com uma embalagem impecável. Atendimento maravilhoso!", "Camila R."],
            ["Contei o tipo de perfume que eu gostava e acertaram em cheio. A fixação é perfeita.", "Jéssica M."],
            ["Comprei pelo WhatsApp e recebi no mesmo dia. Tudo muito discreto e cuidadoso.", "Cliente verificada"],
          ].map(([text, author]) => <article key={author}><div className="stars">★★★★★</div><p>“{text}”</p><strong>{author}</strong><span>Compra verificada</span></article>)}
        </div>
      </section>

      <section className="newsletter">
        <div><span className="eyebrow light">Clube Andora</span><h2>Novidades que chegam perfumadas.</h2><p>Receba lançamentos, benefícios e um carinho especial no mês do seu aniversário.</p></div>
        <form onSubmit={(e) => { e.preventDefault(); setToast("Cadastro realizado! Bem-vinda ao Clube Andora."); }}>
          <input aria-label="Seu nome" placeholder="Seu nome" required />
          <input aria-label="Seu WhatsApp" placeholder="WhatsApp com DDD" required />
          <button className="button rose">Quero fazer parte <Icon name="arrow"/></button>
        </form>
      </section>

      <footer>
        <div className="footer-brand"><img src="/assets/andora-logo.png" alt="Andora Essence"/><p>Segredo da Pele</p><span>Perfumes, chocolates e presentes especiais em Pedro do Rosário - MA.</span></div>
        <div><h4>Explore</h4><button onClick={() => setCatalogOpen(true)}>Catálogo</button><button onClick={() => scrollTo("presentes")}>Presentes</button><button onClick={openAdult}>Produtos especiais +18</button><button onClick={() => scrollTo("sobre")}>Sobre a loja</button></div>
        <div><h4>Atendimento</h4><a href={`https://wa.me/${WHATSAPP}`}>WhatsApp (98) 98444-7708</a><span>Pedro do Rosário - MA</span><span>Seg a sáb • 8h às 18h</span><button onClick={() => setAdminOpen(true)}>Acesso administrativo</button></div>
        <div><h4>Informações</h4><button onClick={() => setToast("Política de privacidade preparada para personalização.")}>Privacidade</button><button onClick={() => setToast("Política de trocas preparada para personalização.")}>Trocas e devoluções</button><button onClick={() => setToast("Termos de uso preparados para personalização.")}>Termos de uso</button><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a></div>
        <div className="footer-bottom"><span>© 2026 Andora Essence. Todos os direitos reservados.</span><span>Compra segura • Atendimento humano • Entrega discreta</span></div>
      </footer>

      <a className="whatsapp-float" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Andora Essence! Vim pelo site e gostaria de atendimento.")}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><Icon name="whatsapp" size={26}/><span>Posso ajudar?</span></a>

      {menuOpen && <div className="mobile-menu overlay">
        <button className="close" onClick={() => setMenuOpen(false)}><Icon name="x"/></button>
        <img src="/assets/andora-logo.png" alt="Andora Essence" />
        {["Início", "Loja", "Presentes", "Produtos especiais", "Nossa essência"].map((item) => <button key={item} onClick={() => item === "Loja" ? (setMenuOpen(false), setCatalogOpen(true)) : item === "Produtos especiais" ? (setMenuOpen(false), openAdult()) : scrollTo(item === "Início" ? "inicio" : item === "Presentes" ? "presentes" : "sobre")}>{item}</button>)}
      </div>}

      {catalogOpen && <div className="modal-backdrop" onMouseDown={() => setCatalogOpen(false)}>
        <section className="catalog-panel" onMouseDown={(e) => e.stopPropagation()}>
          <div className="panel-head"><div><span className="eyebrow">Loja Andora</span><h2>Encontre sua essência</h2></div><button className="close" onClick={() => setCatalogOpen(false)}><Icon name="x"/></button></div>
          <div className="search-row"><Icon name="search"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Busque por produto ou marca..." /></div>
          <div className="category-pills">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => item === "Produtos Especiais" && !adultAllowed ? setAgeGate(true) : setCategory(item)}>{item}</button>)}</div>
          <div className="catalog-body">
            <aside>
              <h4>Filtros</h4>
              <label>Preço até <strong>{money(maxPrice)}</strong><input type="range" min="50" max="400" step="10" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))}/></label>
              <label className="check-label"><input type="checkbox" checked={promoOnly} onChange={(e) => setPromoOnly(e.target.checked)}/><span/> Somente promoções</label>
              <div className="stock-note"><span className="dot"/> Produtos disponíveis</div>
            </aside>
            <div className="catalog-results"><div className="results-label">{visibleProducts.length} produtos encontrados <select aria-label="Ordenar"><option>Mais relevantes</option><option>Menor preço</option><option>Maior preço</option></select></div>
              <div className="product-grid catalog-grid">{visibleProducts.map((product) => <ProductCard key={product.id} product={product} favorite={favorites.includes(product.id)} onFavorite={() => setFavorites((f) => f.includes(product.id) ? f.filter((id) => id !== product.id) : [...f, product.id])} onAdd={() => addToCart(product)}/>)}</div>
            </div>
          </div>
        </section>
      </div>}

      {cartOpen && <div className="drawer-backdrop" onMouseDown={() => setCartOpen(false)}>
        <aside className="cart-drawer" onMouseDown={(e) => e.stopPropagation()}>
          <div className="panel-head"><div><span className="eyebrow">Sua seleção</span><h2>Sacola <small>{cartCount}</small></h2></div><button className="close" onClick={() => setCartOpen(false)}><Icon name="x"/></button></div>
          {cart.length === 0 ? <div className="empty-cart"><Icon name="bag" size={42}/><h3>Sua sacola está vazia</h3><p>Escolha algo especial para você ou para presentear.</p><button className="button primary" onClick={() => { setCartOpen(false); setCatalogOpen(true); }}>Explorar produtos</button></div> :
          <>
            <div className="cart-items">{cart.map((item) => <article key={item.id}>
              <img src={item.image} alt={item.name}/><div><span>{item.category}</span><h3>{item.name}</h3><strong>{money(item.price)}</strong><label className="gift-check"><input type="checkbox" checked={item.giftWrap ?? false} onChange={(e) => setCart((current) => current.map((p) => p.id === item.id ? {...p, giftWrap: e.target.checked} : p))}/> Embalagem para presente (+ R$ 9,90)</label><div className="quantity"><button onClick={() => updateQuantity(item.id, -1)}><Icon name="minus" size={15}/></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)}><Icon name="plus" size={15}/></button></div></div>
            </article>)}</div>
            <div className="cart-message"><label>Mensagem para o presente</label><textarea value={giftMessage} onChange={(e) => setGiftMessage(e.target.value)} placeholder="Escreva sua mensagem carinhosa..." maxLength={180}/><span>{giftMessage.length}/180</span></div>
            <div className="cart-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>A entrega será calculada no próximo passo.</p><button className="button primary full" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>Finalizar pedido <Icon name="arrow"/></button><div className="secure"><Icon name="lock" size={16}/> Compra segura e atendimento personalizado</div></div>
          </>}
        </aside>
      </div>}

      {checkoutOpen && <div className="modal-backdrop" onMouseDown={() => setCheckoutOpen(false)}>
        <section className="checkout-panel" onMouseDown={(e) => e.stopPropagation()}>
          <div className="panel-head"><div><span className="eyebrow">Checkout</span><h2>Finalize com carinho</h2></div><button className="close" onClick={() => setCheckoutOpen(false)}><Icon name="x"/></button></div>
          {orderNumber ? <div className="order-success"><div className="success-icon"><Icon name="check" size={34}/></div><span>Pedido enviado</span><h2>{orderNumber}</h2><p>O resumo foi aberto no WhatsApp da Andora Essence. Envie a mensagem para confirmar seu pedido e o pagamento.</p><button className="button primary" onClick={() => { setCheckoutOpen(false); setCart([]); setOrderNumber(""); }}>Concluir</button></div> :
          <form className="checkout-grid" onSubmit={finishOrder}>
            <div className="form-card"><h3>1. Seus dados</h3><div className="field-grid"><label>Nome completo<input name="name" required placeholder="Como podemos chamar você?"/></label><label>WhatsApp<input name="phone" required placeholder="(98) 9 0000-0000"/></label><label className="wide">Endereço<input name="address" required placeholder="Rua, número e referência"/></label><label>Bairro / modalidade<select value={delivery} onChange={(e) => setDelivery(e.target.value)}>{Object.entries(neighborhoods).map(([name, fee]) => <option key={name}>{name}{fee ? ` • ${money(fee)}` : " • grátis"}</option>)}</select></label><label>Data de aniversário<input type="date" name="birthday"/></label><label className="wide">Observação<textarea name="notes" placeholder="Horário, referência ou pedido especial..."/></label></div></div>
            <div className="payment-card"><h3>2. Pagamento via Pix</h3><div className="qr-mock"><div className="qr-grid">{Array.from({length: 81}, (_, i) => <i key={i} className={(i * 7 + i % 5) % 3 === 0 ? "on" : ""}/>)}</div><div><span>Valor do Pix</span><strong>{money(total)}</strong><small>QR Code ilustrativo</small></div></div><label>Pix copia e cola<div className="copy-field"><input value={pixCode} readOnly/><button type="button" onClick={() => { navigator.clipboard?.writeText(pixCode); setToast("Código Pix copiado"); }}>Copiar</button></div></label><p className="payment-note">Na integração final, o QR Code será gerado e confirmado automaticamente pelo provedor de pagamento.</p></div>
            <div className="order-card"><h3>Resumo</h3>{cart.map((item) => <div className="mini-item" key={item.id}><img src={item.image} alt=""/><span>{item.quantity}x {item.name}</span><strong>{money(item.price * item.quantity)}</strong></div>)}<div className="totals"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Entrega <strong>{deliveryFee ? money(deliveryFee) : "Grátis"}</strong></span><b>Total <strong>{money(total)}</strong></b></div><button className="button primary full" type="submit">Gerar pedido e enviar no WhatsApp</button></div>
          </form>}
        </section>
      </div>}

      {ageGate && <div className="modal-backdrop age-backdrop">
        <section className="age-modal"><div className="age-mark">18+</div><span className="eyebrow">Conteúdo reservado</span><h2>Você tem 18 anos ou mais?</h2><p>Esta área contém produtos destinados exclusivamente a maiores de 18 anos. Sua privacidade será sempre respeitada.</p><button className="button primary full" onClick={confirmAdult}>Sim, tenho 18 anos ou mais</button><button className="text-button" onClick={() => setAgeGate(false)}>Não, voltar à loja</button><div className="privacy-line"><Icon name="lock" size={16}/> Navegação discreta • Embalagem sem identificação</div></section>
      </div>}

      {accountOpen && <div className="modal-backdrop" onMouseDown={() => setAccountOpen(false)}>
        <section className="account-modal" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setAccountOpen(false)}><Icon name="x"/></button><span className="eyebrow">Clube Andora</span><h2>Seu cantinho especial</h2><p>Cadastre-se para salvar favoritos, acompanhar compras e receber carinho no seu aniversário.</p><form onSubmit={(e) => { e.preventDefault(); setToast("Cadastro salvo com sucesso!"); setAccountOpen(false); }}><label>Nome<input required /></label><label>WhatsApp<input required /></label><label>Endereço<input required /></label><label>Aniversário<input type="date"/></label><label>Preferências<select><option>Perfumes femininos</option><option>Perfumes masculinos</option><option>Chocolates e presentes</option><option>Cosméticos</option></select></label><label className="check-label"><input type="checkbox" defaultChecked/><span/> Quero receber promoções no WhatsApp</label><button className="button primary full">Criar meu cadastro</button></form><div className="loyalty-box"><Icon name="gift"/><div><strong>Programa Andora</strong><span>A cada 5 compras, ganhe 15% de desconto na próxima.</span></div><b>0/5</b></div></section>
      </div>}

      {adminOpen && <AdminPanel tab={adminTab} setTab={setAdminTab} close={() => setAdminOpen(false)} />}
      {toast && <div className="toast"><Icon name="check"/>{toast}</div>}
    </main>
  );
}

function ProductCard({ product, favorite, onFavorite, onAdd }: { product: Product; favorite: boolean; onFavorite: () => void; onAdd: () => void }) {
  return <article className="product-card">
    <div className="product-image">
      {product.badge && <span className="badge">{product.badge}</span>}
      <button className={`favorite ${favorite ? "active" : ""}`} onClick={onFavorite} aria-label="Favoritar"><Icon name="heart"/></button>
      <img src={product.image} alt={product.name}/>
      <button className="quick-add" onClick={onAdd}>Adicionar à sacola <Icon name="bag" size={17}/></button>
    </div>
    <span className="product-category">{product.category}</span>
    <h3>{product.name}</h3>
    <p>{product.description}</p>
    <div className="price">{product.oldPrice && <del>{money(product.oldPrice)}</del>}<strong>{money(product.price)}</strong><small>ou 3x de {money(product.price / 3)}</small></div>
  </article>;
}

function AdminPanel({ tab, setTab, close }: { tab: string; setTab: (tab: string) => void; close: () => void }) {
  const tabs = ["Visão geral", "Produtos", "Pedidos", "Clientes", "Promoções", "Financeiro", "Relatórios"];
  const [authenticated, setAuthenticated] = useState(false);
  if (!authenticated) return <div className="modal-backdrop admin-login"><section><button className="close" onClick={close}><Icon name="x"/></button><img src="/assets/andora-logo.png" alt="Andora Essence"/><span className="eyebrow">Área protegida</span><h2>Administração</h2><p>Ambiente demonstrativo. Use qualquer senha com 6 ou mais caracteres.</p><form onSubmit={(e) => { e.preventDefault(); setAuthenticated(true); }}><label>E-mail<input type="email" defaultValue="admin@andoraessence.com.br" required/></label><label>Senha<input type="password" minLength={6} required placeholder="••••••••"/></label><button className="button primary full">Entrar no painel</button></form></section></div>;

  return <div className="admin-shell">
    <aside><div className="admin-logo">A<span>Andora</span></div><nav>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav><button onClick={close}>← Voltar para a loja</button></aside>
    <section className="admin-main"><header><div><span>Painel administrativo</span><h1>{tab}</h1></div><div className="admin-user"><span>AE</span><div><strong>Andora Essence</strong><small>Administrador</small></div></div></header>
      {tab === "Visão geral" && <><div className="metric-grid">{[["Vendas hoje", "R$ 1.248,60", "+12,5%"],["Pedidos", "18", "4 aguardando"],["Ticket médio", "R$ 69,37", "+8,2%"],["Estoque baixo", "6 itens", "Repor agora"]].map((m) => <article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><div className="admin-grid"><article className="chart-card"><div className="card-title"><h3>Vendas nos últimos 7 dias</h3><button>Este mês ▾</button></div><div className="bar-chart">{[45,70,58,92,65,80,100].map((v,i) => <div key={i}><i style={{height:`${v}%`}}/><span>{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i]}</span></div>)}</div></article><article className="recent-card"><div className="card-title"><h3>Pedidos recentes</h3><button>Ver todos</button></div>{[["AE-2048","Mariana S.","R$ 189,90","Pago"],["AE-2047","Joana R.","R$ 79,90","Separação"],["AE-2046","Carlos M.","R$ 349,90","Entrega"],["AE-2045","Ana L.","R$ 159,90","Recebido"]].map((p) => <div className="order-row" key={p[0]}><span><strong>{p[0]}</strong><small>{p[1]}</small></span><b>{p[2]}</b><em>{p[3]}</em></div>)}</article></div></>}
      {tab === "Produtos" && <AdminTable title="Produtos cadastrados" action="+ Novo produto" heads={["Produto","Categoria","Preço","Estoque","Status"]} rows={products.slice(0,6).map(p => [p.name,p.category,money(p.price),`${p.stock} un.`,p.stock < 6 ? "Estoque baixo" : "Ativo"])}/>}
      {tab === "Pedidos" && <AdminTable title="Gestão de pedidos" action="Exportar" heads={["Pedido","Cliente","Total","Pagamento","Status"]} rows={[["AE-2048","Mariana S.","R$ 189,90","Pix","Pago"],["AE-2047","Joana R.","R$ 79,90","Pix","Em separação"],["AE-2046","Carlos M.","R$ 349,90","Pix","Saiu para entrega"],["AE-2045","Ana L.","R$ 159,90","Aguardando","Recebido"]]}/>}
      {tab === "Clientes" && <AdminTable title="Clientes e aniversariantes" action="+ Novo cliente" heads={["Cliente","WhatsApp","Compras","Preferência","Aniversário"]} rows={[["Mariana Silva","(98) 9 8844-1122","8","Perfumes","12/07"],["Joana Rocha","(98) 9 9123-7788","5","Presentes","23/07"],["Ana Luz","(98) 9 8455-2211","3","Chocolates","30/07"]]}/>}
      {tab === "Promoções" && <AdminTable title="Cupons e campanhas" action="+ Criar promoção" heads={["Cupom","Benefício","Uso","Validade","Status"]} rows={[["BEMVINDA10","10% primeira compra","32 usos","31/12/2026","Ativo"],["ANDORA15","15% fidelidade","18 usos","Sem validade","Ativo"],["PRESENTE","Embalagem grátis","9 usos","31/07/2026","Ativo"]]}/>}
      {tab === "Financeiro" && <><div className="metric-grid">{[["Receita do mês","R$ 18.460,90","+18%"],["Despesas","R$ 6.240,00","33,8%"],["Lucro estimado","R$ 12.220,90","66,2%"],["A receber","R$ 780,00","6 pedidos"]].map(m => <article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><AdminTable title="Despesas recentes" action="+ Cadastrar despesa" heads={["Descrição","Categoria","Data","Forma","Valor"]} rows={[["Reposição perfumes","Estoque","21/07/2026","Pix","R$ 2.450,00"],["Embalagens premium","Materiais","19/07/2026","Pix","R$ 480,00"],["Entrega local","Logística","18/07/2026","Dinheiro","R$ 120,00"]]}/></>}
      {tab === "Relatórios" && <div className="report-grid">{["Vendas por período","Produtos mais vendidos","Estoque baixo","Clientes e aniversariantes","Despesas e lucro","Backup completo"].map((r) => <article key={r}><Icon name="arrow"/><h3>{r}</h3><p>Visualize, filtre e exporte os dados em PDF.</p><button onClick={() => window.print()}>Gerar relatório</button></article>)}</div>}
    </section>
  </div>;
}

function AdminTable({title, action, heads, rows}: {title:string; action:string; heads:string[]; rows:string[][]}) {
  return <article className="table-card"><div className="card-title"><h3>{title}</h3><button>{action}</button></div><div className="table-wrap"><table><thead><tr>{heads.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div></article>;
}
