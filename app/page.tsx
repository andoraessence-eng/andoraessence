"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/purity */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  completeSale as completeSaleRemote,
  createCustomer,
  createExpense as createExpenseRemote,
  createWithdrawal as createWithdrawalRemote,
  deleteProduct as deleteProductRemote,
  deletePublication as deletePublicationRemote,
  hasAdminSession,
  isSupabaseConfigured,
  loadAdminData,
  loadStorefront,
  registerAdmin,
  saveProduct as saveProductRemote,
  savePublication as savePublicationRemote,
  setPublicationState,
  signInAdmin,
  signOutAdmin,
  type Expense,
  type PaymentMethod,
  type PosItem,
  type Product,
  type Publication,
  type Sale,
  type Withdrawal,
} from "../lib/andora-data";

type CartItem = Product & { quantity: number; giftWrap?: boolean };

const WHATSAPP = "5598984447708";

const initialProducts: Product[] = [
  { id: "seed-1", code: "AND-001", name: "Aura Élégance", category: "Perfumes femininos", brand: "Andora Selection", type: "Eau de Parfum", cost: 98, price: 189.9, oldPrice: 229.9, stock: 12, badge: "Mais vendido", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=900&q=86", description: "Floral âmbar elegante, com saída luminosa e fundo envolvente." },
  { id: "seed-2", code: "AND-002", name: "Noble Intense", category: "Perfumes masculinos", brand: "Andora Selection", type: "Eau de Parfum", cost: 116, price: 219.9, stock: 7, badge: "Lançamento", image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=900&q=86", description: "Madeiras nobres, especiarias quentes e assinatura marcante." },
  { id: "seed-3", code: "AND-003", name: "Maison Dorée", category: "Perfumes importados", brand: "Maison", type: "Importado", cost: 214, price: 349.9, stock: 4, badge: "Exclusivo", image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?auto=format&fit=crop&w=900&q=86", description: "Uma fragrância sofisticada para ocasiões inesquecíveis." },
  { id: "seed-4", code: "AND-004", name: "Essência 214", category: "Contratipos", brand: "Essencial", type: "Contratipo", cost: 36, price: 79.9, stock: 18, badge: "Favorito", image: "https://images.unsplash.com/photo-1619994403073-2cec844b8e63?auto=format&fit=crop&w=900&q=86", description: "Alta fixação e personalidade, inspirada em grandes clássicos." },
  { id: "seed-5", code: "AND-005", name: "Caixa Cacau Nobre", category: "Chocolates", brand: "Cacau Nobre", type: "Chocolate fino", cost: 38, price: 69.9, stock: 20, badge: "Presenteável", image: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=900&q=86", description: "Seleção de bombons finos em embalagem especial." },
  { id: "seed-6", code: "AND-006", name: "Ritual de Carinho", category: "Kits presente", brand: "Andora", type: "Kit", cost: 87, price: 159.9, oldPrice: 179.9, stock: 8, badge: "Kit especial", image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?auto=format&fit=crop&w=900&q=86", description: "Perfume, chocolate fino, cartão e embalagem premium." },
  { id: "seed-7", code: "AND-007", name: "Velvet Body Cream", category: "Cosméticos", brand: "Andora Beauty", type: "Hidratante", cost: 24.5, price: 54.9, stock: 15, image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=86", description: "Textura aveludada, fragrância delicada e hidratação profunda." },
  { id: "seed-8", code: "AND-008", name: "Noir Privé", category: "Produtos Especiais", brand: "Linha Íntima", type: "Bem-estar", cost: 61, price: 119.9, stock: 9, adult: true, badge: "+18", image: "https://images.unsplash.com/photo-1615634260167-c8cdede054de?auto=format&fit=crop&w=900&q=80", description: "Item de bem-estar íntimo em embalagem reservada e envio discreto." },
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
  const introVideoRef = useRef<HTMLVideoElement>(null);
  const [introMode, setIntroMode] = useState<"checking" | "welcome" | "playing" | "hidden">("checking");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [publications, setPublications] = useState<Publication[]>([
    { id: "seed-publication", title: "Mês dos Pais Andora", subtitle: "Perfumes marcantes e kits preparados para surpreender.", theme: "Dia dos Pais", active: true, startsAt: "2026-07-20", endsAt: "2026-08-09" },
  ]);
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
  const [favorites, setFavorites] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [delivery, setDelivery] = useState("Centro");
  const [giftMessage, setGiftMessage] = useState("");
  const [adminTab, setAdminTab] = useState("Visão geral");

  useEffect(() => {
    const isAdmin = window.location.pathname.startsWith("/admin");
    const introSeen = localStorage.getItem("andora-intro-seen-v1") === "true";
    setIntroMode(isAdmin || introSeen ? "hidden" : "welcome");
    const saved = localStorage.getItem("andora-cart");
    if (saved) setCart(JSON.parse(saved));
    if (isSupabaseConfigured) {
      void loadStorefront()
        .then((data) => {
          if (!data) return;
          if (data.products.length) setProducts(data.products);
          setPublications(data.publications);
        })
        .catch(() => {
          setToast("Banco ainda não inicializado. Exibindo catálogo de demonstração.");
        });
    } else {
      const savedProducts = localStorage.getItem("andora-products");
      const savedPublications = localStorage.getItem("andora-publications");
      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedPublications) setPublications(JSON.parse(savedPublications));
    }
    if (window.location.pathname.startsWith("/admin")) setAdminOpen(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("andora-cart", JSON.stringify(cart));
  }, [cart]);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem("andora-products", JSON.stringify(products));
    }
  }, [products]);
  useEffect(() => {
    if (!isSupabaseConfigured) {
      localStorage.setItem("andora-publications", JSON.stringify(publications));
    }
  }, [publications]);

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
  }), [products, category, search, maxPrice, promoOnly, adultAllowed]);

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

  function updateQuantity(id: string, amount: number) {
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

  function startIntro() {
    localStorage.setItem("andora-intro-seen-v1", "true");
    setIntroMode("playing");
    const video = introVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = false;
      video.volume = 1;
      void video.play().catch(() => setIntroMode("welcome"));
    }
  }

  function closeIntro() {
    localStorage.setItem("andora-intro-seen-v1", "true");
    introVideoRef.current?.pause();
    setIntroMode("hidden");
  }

  const pixCode = `00020126360014BR.GOV.BCB.PIX0114+5598984447708520400005303986540${total.toFixed(2)}5802BR5922ANDORA ESSENCE6009PEDRO ROSARIO62070503***6304`;

  return (
    <main>
      {(introMode === "welcome" || introMode === "playing") && <section className={`brand-intro ${introMode === "playing" ? "is-playing" : ""}`} aria-label="Apresentação Andora Essence">
        <video ref={introVideoRef} src="/assets/andora-intro.mp4" playsInline preload="auto" onEnded={closeIntro} />
        <div className="intro-veil" />
        <div className="intro-orbit orbit-one" />
        <div className="intro-orbit orbit-two" />
        <div className="intro-welcome">
          <span>Uma experiência Andora</span>
          <img src="/assets/andora-logo-light.png" alt="Andora Essence — Segredo da Pele" />
          <p>Perfumes, presentes e sensações escolhidas para marcar.</p>
          <button className="intro-enter" onClick={startIntro}><span>Conhecer a essência</span><Icon name="arrow" /></button>
          <button className="intro-skip" onClick={closeIntro}>Entrar sem apresentação</button>
        </div>
        <div className="intro-playing-bar">
          <img src="/assets/andora-logo-light.png" alt="" />
          <span>Apresentação da marca • áudio ativado</span>
        </div>
        <button className="intro-close" onClick={closeIntro} aria-label="Pular apresentação">Pular <Icon name="arrow" size={16} /></button>
      </section>}
      <div className="topbar">Entrega em Pedro do Rosário • Primeira compra: use <strong>BEMVINDA10</strong></div>
      <header className="header">
        <button className="icon-button mobile-only" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Icon name="menu" /></button>
        <button className="brand" onClick={() => scrollTo("inicio")} aria-label="Andora Essence - início">
          <img src="/assets/andora-logo-dark.png" alt="Andora Essence" />
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

      {publications.filter((item) => item.active).map((item) => <section className={`campaign-banner ${item.image ? "with-image" : ""}`} key={item.id}>
        <div className="campaign-copy"><span>{item.theme}</span><h2>{item.title}</h2><p>{item.subtitle}</p><button className="button primary" onClick={() => setCatalogOpen(true)}>Ver seleção <Icon name="arrow"/></button></div>
        {item.image && <div className="campaign-photo"><img src={item.image} alt={item.title}/><i /></div>}
      </section>)}

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
        <div className="footer-brand"><img src="/assets/andora-logo-light.png" alt="Andora Essence"/><p>Segredo da Pele</p><span>Perfumes, chocolates e presentes especiais em Pedro do Rosário - MA.</span></div>
        <div><h4>Explore</h4><button onClick={() => setCatalogOpen(true)}>Catálogo</button><button onClick={() => scrollTo("presentes")}>Presentes</button><button onClick={openAdult}>Produtos especiais +18</button><button onClick={() => scrollTo("sobre")}>Sobre a loja</button></div>
        <div><h4>Atendimento</h4><a href={`https://wa.me/${WHATSAPP}`}>WhatsApp (98) 98444-7708</a><span>Pedro do Rosário - MA</span><span>Seg a sáb • 8h às 18h</span></div>
        <div><h4>Informações</h4><button onClick={() => setToast("Política de privacidade preparada para personalização.")}>Privacidade</button><button onClick={() => setToast("Política de trocas preparada para personalização.")}>Trocas e devoluções</button><button onClick={() => setToast("Termos de uso preparados para personalização.")}>Termos de uso</button><a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a></div>
        <div className="footer-bottom"><span>© 2026 Andora Essence. Todos os direitos reservados.</span><span>Compra segura • Atendimento humano • Entrega discreta</span></div>
      </footer>

      <a className="whatsapp-float" href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent("Olá, Andora Essence! Vim pelo site e gostaria de atendimento.")}`} target="_blank" rel="noreferrer" aria-label="Falar no WhatsApp"><Icon name="whatsapp" size={26}/><span>Posso ajudar?</span></a>

      {menuOpen && <div className="mobile-menu overlay">
        <button className="close" onClick={() => setMenuOpen(false)}><Icon name="x"/></button>
        <img src="/assets/andora-logo-light.png" alt="Andora Essence" />
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
        <section className="account-modal" onMouseDown={(e) => e.stopPropagation()}><button className="close" onClick={() => setAccountOpen(false)}><Icon name="x"/></button><span className="eyebrow">Clube Andora</span><h2>Seu cantinho especial</h2><p>Cadastre-se para salvar favoritos, acompanhar compras e receber carinho no seu aniversário.</p><form onSubmit={async (e) => { e.preventDefault(); const data = new FormData(e.currentTarget); try { if (isSupabaseConfigured) await createCustomer({ name: String(data.get("name")), phone: String(data.get("phone")), address: String(data.get("address")), birthday: String(data.get("birthday") || ""), preference: String(data.get("preference") || ""), acceptsWhatsapp: data.get("acceptsWhatsapp") === "on" }); setToast("Cadastro salvo com sucesso!"); setAccountOpen(false); } catch { setToast("Não foi possível salvar o cadastro agora."); } }}><label>Nome<input name="name" required /></label><label>WhatsApp<input name="phone" required /></label><label>Endereço<input name="address" required /></label><label>Aniversário<input name="birthday" type="date"/></label><label>Preferências<select name="preference"><option>Perfumes femininos</option><option>Perfumes masculinos</option><option>Chocolates e presentes</option><option>Cosméticos</option></select></label><label className="check-label"><input name="acceptsWhatsapp" type="checkbox" defaultChecked/><span/> Quero receber promoções no WhatsApp</label><button className="button primary full">Criar meu cadastro</button></form><div className="loyalty-box"><Icon name="gift"/><div><strong>Programa Andora</strong><span>A cada 5 compras, ganhe 15% de desconto na próxima.</span></div><b>0/5</b></div></section>
      </div>}

      {adminOpen && <AdminPanel tab={adminTab} setTab={setAdminTab} close={() => window.location.pathname.startsWith("/admin") ? window.location.assign("/") : setAdminOpen(false)} products={products} setProducts={setProducts} publications={publications} setPublications={setPublications} />}
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

function LegacyAdminPanel({ tab, setTab, close }: { tab: string; setTab: (tab: string) => void; close: () => void }) {
  const tabs = ["Visão geral", "Produtos", "Pedidos", "Clientes", "Promoções", "Financeiro", "Relatórios"];
  const [authenticated, setAuthenticated] = useState(false);
  if (!authenticated) return <div className="modal-backdrop admin-login"><section><button className="close" onClick={close}><Icon name="x"/></button><img src="/assets/andora-logo.png" alt="Andora Essence"/><span className="eyebrow">Área protegida</span><h2>Administração</h2><p>Ambiente demonstrativo. Use qualquer senha com 6 ou mais caracteres.</p><form onSubmit={(e) => { e.preventDefault(); setAuthenticated(true); }}><label>E-mail<input type="email" defaultValue="admin@andoraessence.com.br" required/></label><label>Senha<input type="password" minLength={6} required placeholder="••••••••"/></label><button className="button primary full">Entrar no painel</button></form></section></div>;

  return <div className="admin-shell">
    <aside><div className="admin-logo">A<span>Andora</span></div><nav>{tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}</nav><button onClick={close}>← Voltar para a loja</button></aside>
    <section className="admin-main"><header><div><span>Painel administrativo</span><h1>{tab}</h1></div><div className="admin-user"><span>AE</span><div><strong>Andora Essence</strong><small>Administrador</small></div></div></header>
      {tab === "Visão geral" && <><div className="metric-grid">{[["Vendas hoje", "R$ 1.248,60", "+12,5%"],["Pedidos", "18", "4 aguardando"],["Ticket médio", "R$ 69,37", "+8,2%"],["Estoque baixo", "6 itens", "Repor agora"]].map((m) => <article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><div className="admin-grid"><article className="chart-card"><div className="card-title"><h3>Vendas nos últimos 7 dias</h3><button>Este mês ▾</button></div><div className="bar-chart">{[45,70,58,92,65,80,100].map((v,i) => <div key={i}><i style={{height:`${v}%`}}/><span>{["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"][i]}</span></div>)}</div></article><article className="recent-card"><div className="card-title"><h3>Pedidos recentes</h3><button>Ver todos</button></div>{[["AE-2048","Mariana S.","R$ 189,90","Pago"],["AE-2047","Joana R.","R$ 79,90","Separação"],["AE-2046","Carlos M.","R$ 349,90","Entrega"],["AE-2045","Ana L.","R$ 159,90","Recebido"]].map((p) => <div className="order-row" key={p[0]}><span><strong>{p[0]}</strong><small>{p[1]}</small></span><b>{p[2]}</b><em>{p[3]}</em></div>)}</article></div></>}
      {tab === "Produtos" && <AdminTable title="Produtos cadastrados" action="+ Novo produto" heads={["Produto","Categoria","Preço","Estoque","Status"]} rows={initialProducts.slice(0,6).map(p => [p.name,p.category,money(p.price),`${p.stock} un.`,p.stock < 6 ? "Estoque baixo" : "Ativo"])}/>}
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

function AdminPanel({ tab, setTab, close, products, setProducts, publications, setPublications }: {
  tab: string; setTab: (tab: string) => void; close: () => void;
  products: Product[]; setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  publications: Publication[]; setPublications: React.Dispatch<React.SetStateAction<Publication[]>>;
}) {
  const tabs = ["Visão geral","PDV e vendas","Produtos","Pedidos","Clientes","Promoções","Publicações","Campanhas","Caixa e sangrias","Despesas","Relatórios"];
  const [authenticated,setAuthenticated] = useState(false);
  const [authChecking,setAuthChecking] = useState(isSupabaseConfigured);
  const [authError,setAuthError] = useState("");
  const [authNotice,setAuthNotice] = useState("");
  const [saving,setSaving] = useState(false);
  const [editor,setEditor] = useState<string|null>(null);
  const [editingProduct,setEditingProduct] = useState<Product|null>(null);
  const [editingPublication,setEditingPublication] = useState<Publication|null>(null);
  const [productImage,setProductImage] = useState("");
  const [publicationImage,setPublicationImage] = useState("");
  const [messageImage,setMessageImage] = useState("");
  const [expenses,setExpenses] = useState<Expense[]>(isSupabaseConfigured ? [] : [{id:"demo-expense-1",description:"Reposição perfumes",category:"Estoque",amount:2450,date:"2026-07-21",recurring:false},{id:"demo-expense-2",description:"Internet da loja",category:"Serviços",amount:119.9,date:"2026-07-10",recurring:true}]);
  const [withdrawals,setWithdrawals] = useState<Withdrawal[]>(isSupabaseConfigured ? [] : [{id:"demo-withdrawal-1",reason:"Pagamento de entrega",amount:120,time:"18/07 • 17:42"}]);
  const [message,setMessage] = useState("Olá, {nome}! A Andora Essence preparou uma seleção especial para você. Posso te mostrar?");
  const [sales,setSales] = useState<Sale[]>([]);
  const [posItems,setPosItems] = useState<PosItem[]>([]);
  const [posSearch,setPosSearch] = useState("");
  const [paymentOne,setPaymentOne] = useState<PaymentMethod>("Pix");
  const [paymentTwo,setPaymentTwo] = useState<PaymentMethod>("Dinheiro");
  const [splitPayment,setSplitPayment] = useState(false);
  const [paymentOneValue,setPaymentOneValue] = useState("");
  const [cashReceived,setCashReceived] = useState("");
  const [pendingPayment,setPendingPayment] = useState(false);
  const [pendingCustomer,setPendingCustomer] = useState("");
  const [pendingDueDate,setPendingDueDate] = useState("");
  useEffect(()=>{
    if (!isSupabaseConfigured) {
      const saved=localStorage.getItem("andora-sales");
      if(saved)setSales(JSON.parse(saved));
      setAuthChecking(false);
      return;
    }
    void hasAdminSession().then((allowed)=>{
      setAuthenticated(allowed);
      setAuthChecking(false);
    });
  },[]);
  useEffect(()=>{
    if(!isSupabaseConfigured) localStorage.setItem("andora-sales",JSON.stringify(sales));
  },[sales]);
  useEffect(()=>{
    if(!authenticated || !isSupabaseConfigured) return;
    void Promise.all([loadAdminData(), loadStorefront()])
      .then(([data, storefront])=>{
        if(!data) return;
        setSales(data.sales);
        setExpenses(data.expenses);
        setWithdrawals(data.withdrawals);
        if (storefront) {
          setProducts(storefront.products);
          setPublications(storefront.publications);
        }
      })
      .catch(()=>setAuthError("Não foi possível carregar os dados administrativos."));
  },[authenticated]);
  const posTotal=posItems.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const posCost=posItems.reduce((sum,item)=>sum+item.cost*item.quantity,0);
  const posProfit=posTotal-posCost;
  const firstAmount=splitPayment?Math.min(Math.max(Number(paymentOneValue)||0,0),posTotal):posTotal;
  const secondAmount=splitPayment?Math.max(posTotal-firstAmount,0):0;
  const cashPart=(paymentOne==="Dinheiro"?firstAmount:0)+(splitPayment&&paymentTwo==="Dinheiro"?secondAmount:0);
  const change=Math.max((Number(cashReceived)||0)-cashPart,0);
  const todayKey=new Date().toISOString().slice(0,10);
  const monthKey=todayKey.slice(0,7);
  const todaySales=sales.filter(s=>s.createdAt.slice(0,10)===todayKey);
  const monthSales=sales.filter(s=>s.createdAt.slice(0,7)===monthKey);
  const todayProfit=todaySales.reduce((sum,s)=>sum+s.profit,0);
  const monthProfit=monthSales.reduce((sum,s)=>sum+s.profit,0);
  if(authChecking) return <div className="modal-backdrop admin-login"><section><img src="/assets/andora-logo-dark.png" alt="Andora Essence"/><span className="eyebrow">Área privada</span><h2>Verificando acesso…</h2><p>Aguarde um instante.</p></section></div>;
  if(!authenticated) return <div className="modal-backdrop admin-login"><section><button className="close" onClick={close}><Icon name="x"/></button><img src="/assets/andora-logo-dark.png" alt="Andora Essence"/><span className="eyebrow">Área privada</span><h2>Gestão Andora</h2><p>{isSupabaseConfigured ? "Entre com o acesso administrativo protegido pelo Supabase." : "Integração ainda não ativada. Modo local de demonstração."}</p>{authError&&<p className="auth-message error">{authError}</p>}{authNotice&&<p className="auth-message success">{authNotice}</p>}<form onSubmit={async e=>{e.preventDefault();const d=new FormData(e.currentTarget);setAuthError("");setAuthNotice("");setSaving(true);try{if(isSupabaseConfigured)await signInAdmin(String(d.get("email")),String(d.get("password")));setAuthenticated(true)}catch(error){setAuthError(error instanceof Error?error.message:"Não foi possível entrar.")}finally{setSaving(false)}}}><label>E-mail<input name="email" type="email" defaultValue="andoraessence@gmail.com" required/></label><label>Senha administrativa<input name="password" type="password" minLength={8} required/></label><button className="button primary full" disabled={saving}>{saving?"Entrando…":"Entrar com segurança"}</button>{isSupabaseConfigured&&<button type="button" className="text-button" disabled={saving} onClick={async()=>{const form=document.querySelector(".admin-login form") as HTMLFormElement|null;if(!form)return;const d=new FormData(form);setAuthError("");setAuthNotice("");setSaving(true);try{await registerAdmin(String(d.get("email")),String(d.get("password")));setAuthNotice("Acesso solicitado. Confirme o e-mail recebido e depois entre no painel.")}catch(error){setAuthError(error instanceof Error?error.message:"Não foi possível criar o acesso.")}finally{setSaving(false)}}}>Primeiro acesso: criar senha do painel</button>}</form></section></div>;
  async function saveProduct(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);const p:Product={id:editingProduct?.id??`new-${crypto.randomUUID()}`,code:String(d.get("code")).trim(),name:String(d.get("name")),category:String(d.get("category")),brand:String(d.get("brand")),type:String(d.get("type")),cost:Number(d.get("cost")),price:Number(d.get("price")),oldPrice:Number(d.get("oldPrice"))||undefined,stock:Number(d.get("stock")),image:productImage||String(d.get("image"))||editingProduct?.image||initialProducts[0].image,badge:String(d.get("badge"))||undefined,adult:d.get("adult")==="on",description:String(d.get("description"))};setSaving(true);try{const saved=isSupabaseConfigured?await saveProductRemote(p):p;setProducts(list=>editingProduct?list.map(x=>x.id===editingProduct.id?saved:x):[saved,...list]);setEditor(null);setProductImage("")}catch(error){alert(error instanceof Error?error.message:"Não foi possível salvar o produto.")}finally{setSaving(false)}}
  async function savePublication(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const d=new FormData(e.currentTarget);const p:Publication={id:editingPublication?.id??`new-${crypto.randomUUID()}`,title:String(d.get("title")),subtitle:String(d.get("subtitle")),theme:String(d.get("theme")),active:d.get("active")==="on",startsAt:String(d.get("startsAt")),endsAt:String(d.get("endsAt")),image:publicationImage||undefined};setSaving(true);try{const saved=isSupabaseConfigured?await savePublicationRemote(p):p;setPublications(list=>editingPublication?list.map(x=>x.id===editingPublication.id?saved:x):[saved,...list]);setEditor(null);setPublicationImage("")}catch(error){alert(error instanceof Error?error.message:"Não foi possível salvar a campanha.")}finally{setSaving(false)}}
  const openProduct=(p:Product|null)=>{setEditingProduct(p);setProductImage(p?.image??"");setEditor("product")}; const openPublication=(p:Publication|null)=>{setEditingPublication(p);setPublicationImage(p?.image??"");setEditor("publication")};
  function chooseProductImage(file?:File){if(!file)return;if(file.size>2_500_000){alert("Escolha uma imagem de até 2,5 MB.");return}const reader=new FileReader();reader.onload=()=>setProductImage(String(reader.result));reader.readAsDataURL(file)}
  function chooseCampaignImage(file:File|undefined, target:"publication"|"message"){if(!file)return;if(file.size>4_000_000){alert("Escolha uma imagem de até 4 MB.");return}const reader=new FileReader();reader.onload=()=>target==="publication"?setPublicationImage(String(reader.result)):setMessageImage(String(reader.result));reader.readAsDataURL(file)}
  function addPosItem(product:Product){if(product.stock<1){alert("Produto sem estoque.");return}setPosItems(items=>{const found=items.find(item=>item.id===product.id);return found?items.map(item=>item.id===product.id?{...item,quantity:Math.min(item.quantity+1,product.stock)}:item):[...items,{...product,quantity:1}]});setPosSearch("")}
  function changePosQuantity(id:string,amount:number){setPosItems(items=>items.map(item=>item.id===id?{...item,quantity:Math.min(item.stock,item.quantity+amount)}:item).filter(item=>item.quantity>0))}
  async function finishPosSale(){
    if(!posItems.length){alert("Adicione pelo menos um produto à venda.");return}
    if(splitPayment&&(firstAmount<=0||secondAmount<=0)){alert("Informe quanto será pago na primeira forma. O restante será calculado automaticamente.");return}
    if(!pendingPayment&&cashPart>0&&(Number(cashReceived)||0)<cashPart){alert("O valor recebido em dinheiro é menor que a parte em espécie.");return}
    if(pendingPayment&&(!pendingCustomer.trim()||!pendingDueDate)){alert("Informe o cliente e o vencimento do pagamento pendente.");return}
    const sale:Sale={id:`VD-${String(Date.now()).slice(-6)}`,createdAt:new Date().toISOString(),items:posItems,revenue:posTotal,cost:posCost,profit:posProfit,payments:pendingPayment?[]:[{method:paymentOne,amount:firstAmount},...(splitPayment?[{method:paymentTwo,amount:secondAmount}]:[])],status:pendingPayment?"Pendente":"Pago",customer:pendingCustomer||undefined,dueDate:pendingDueDate||undefined};
    setSaving(true);
    try {
      if(isSupabaseConfigured) await completeSaleRemote(sale);
      setSales(list=>[sale,...list]);
      setProducts(list=>list.map(product=>{const sold=posItems.find(item=>item.id===product.id);return sold?{...product,stock:Math.max(product.stock-sold.quantity,0)}:product}));
      setPosItems([]);setPaymentOneValue("");setCashReceived("");setPendingPayment(false);setPendingCustomer("");setPendingDueDate("");
      alert(`Venda ${sale.id} registrada. Lucro: ${money(sale.profit)}${change>0?` • Troco: ${money(change)}`:""}`);
    } catch(error) {
      alert(error instanceof Error ? error.message : "Não foi possível concluir a venda.");
    } finally {
      setSaving(false);
    }
  }
  async function removeProduct(product: Product) {
    if (!confirm(`Excluir ${product.name}?`)) return;
    try {
      if (isSupabaseConfigured && !product.id.startsWith("seed-")) {
        await deleteProductRemote(product.id);
      }
      setProducts((current) => current.filter((item) => item.id !== product.id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível excluir o produto.");
    }
  }
  async function togglePublication(publication: Publication) {
    const active = !publication.active;
    try {
      if (isSupabaseConfigured && !publication.id.startsWith("seed-")) {
        await setPublicationState(publication.id, active);
      }
      setPublications((current) =>
        current.map((item) =>
          item.id === publication.id ? { ...item, active } : item,
        ),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível alterar a publicação.");
    }
  }
  async function removePublication(publication: Publication) {
    if (!confirm("Excluir publicação?")) return;
    try {
      if (isSupabaseConfigured && !publication.id.startsWith("seed-")) {
        await deletePublicationRemote(publication.id);
      }
      setPublications((current) =>
        current.filter((item) => item.id !== publication.id),
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível excluir a publicação.");
    }
  }
  async function saveExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const expense: Omit<Expense, "id"> = {
      description: String(data.get("description")),
      category: String(data.get("category")),
      amount: Number(data.get("amount")),
      date: String(data.get("date")),
      recurring: data.get("recurring") === "on",
    };
    try {
      const saved = isSupabaseConfigured
        ? await createExpenseRemote(expense)
        : { ...expense, id: `demo-${crypto.randomUUID()}` };
      setExpenses((current) => [saved, ...current]);
      setEditor(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível registrar a despesa.");
    }
  }
  async function saveWithdrawal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const withdrawal = {
      reason: String(data.get("reason")),
      amount: Number(data.get("amount")),
    };
    try {
      const saved = isSupabaseConfigured
        ? await createWithdrawalRemote(withdrawal)
        : { ...withdrawal, id: `demo-${crypto.randomUUID()}`, time: "Agora" };
      setWithdrawals((current) => [saved, ...current]);
      setEditor(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível registrar a sangria.");
    }
  }
  return <div className="admin-shell">
    <aside><img className="admin-brand-image" src="/assets/andora-logo-light.png" alt="Andora Essence"/><nav>{tabs.map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x}</button>)}</nav><button onClick={()=>{void signOutAdmin();close()}}>← Sair do painel</button></aside>
    <section className="admin-main"><header><div><span>Painel administrativo • ambiente privado</span><h1>{tab}</h1></div><div className="admin-user"><span>AE</span><div><strong>Andora Essence</strong><small>Administrador</small></div></div></header>
      {tab==="Visão geral"&&<><div className="metric-grid">{[["Vendas hoje",money(todaySales.reduce((sum,s)=>sum+s.revenue,0)),`${todaySales.length} vendas`],["Lucro de hoje",money(todayProfit),"Calculado pelo custo"],["Lucro do mês",money(monthProfit),`${monthSales.length} vendas`],["Estoque baixo",`${products.filter(p=>p.stock<6).length} itens`,"Repor agora"]].map(m=><article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><div className="admin-grid"><article className="chart-card"><div className="card-title"><h3>Resultado financeiro real</h3><button onClick={()=>setTab("PDV e vendas")}>Abrir PDV</button></div><div className="profit-summary"><div><span>Faturamento mensal</span><strong>{money(monthSales.reduce((sum,s)=>sum+s.revenue,0))}</strong></div><div><span>Custo dos produtos</span><strong>{money(monthSales.reduce((sum,s)=>sum+s.cost,0))}</strong></div><div className="profit-highlight"><span>Lucro bruto</span><strong>{money(monthProfit)}</strong></div></div></article><article className="recent-card"><div className="card-title"><h3>Ações rápidas</h3></div><div className="quick-actions"><button onClick={()=>setTab("PDV e vendas")}>+ Nova venda no PDV</button><button onClick={()=>openProduct(null)}>+ Cadastrar produto</button><button onClick={()=>openPublication(null)}>+ Criar campanha visual</button><button onClick={()=>setEditor("expense")}>+ Lançar despesa</button></div></article></div></>}
      {tab==="PDV e vendas"&&<><div className="metric-grid">{[["Venda atual",money(posTotal),`${posItems.reduce((s,i)=>s+i.quantity,0)} itens`],["Custo da venda",money(posCost),"Somente administrativo"],["Lucro desta venda",money(posProfit),posTotal?`${((posProfit/posTotal)*100).toFixed(1)}% de margem`:"Aguardando itens"],["Lucro do mês",money(monthProfit),`${monthSales.length} vendas`]].map(m=><article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><div className="pos-layout"><section className="pos-catalog"><div className="pos-heading"><div><span className="eyebrow">Venda de balcão</span><h2>Localize por nome ou código</h2></div><div className="pos-search"><Icon name="search"/><input value={posSearch} onChange={e=>setPosSearch(e.target.value)} placeholder="Ex.: AND-001 ou perfume"/></div></div><div className="pos-product-grid">{products.filter(p=>`${p.code} ${p.name}`.toLowerCase().includes(posSearch.toLowerCase())).slice(0,12).map(p=><button key={p.id} onClick={()=>addPosItem(p)} disabled={p.stock<1}><img src={p.image} alt=""/><span><small>{p.code}</small><strong>{p.name}</strong><em>{money(p.price)} • {p.stock} un.</em></span><b>+</b></button>)}</div></section><aside className="pos-receipt"><div className="receipt-head"><span>Venda em andamento</span><strong>{posItems.length?`${posItems.length} produtos`:"Carrinho vazio"}</strong></div><div className="receipt-items">{posItems.map(item=><div key={item.id}><span><strong>{item.name}</strong><small>{item.code} • {money(item.price)} cada</small></span><div className="pos-qty"><button onClick={()=>changePosQuantity(item.id,-1)}>−</button><b>{item.quantity}</b><button onClick={()=>changePosQuantity(item.id,1)}>+</button></div><strong>{money(item.price*item.quantity)}</strong></div>)}</div><div className="receipt-total"><span>Subtotal <b>{money(posTotal)}</b></span><span className="receipt-profit">Lucro estimado <b>{money(posProfit)}</b></span><strong>Total <b>{money(posTotal)}</b></strong></div><div className="payment-box"><label className="pending-toggle"><input type="checkbox" checked={pendingPayment} onChange={e=>setPendingPayment(e.target.checked)}/> Cadastrar como pagamento pendente</label>{pendingPayment?<div className="pending-fields"><label>Cliente<input value={pendingCustomer} onChange={e=>setPendingCustomer(e.target.value)} placeholder="Nome do cliente"/></label><label>Vencimento<input type="date" value={pendingDueDate} onChange={e=>setPendingDueDate(e.target.value)}/></label></div>:<><div className="payment-row"><label>Forma de pagamento<select value={paymentOne} onChange={e=>setPaymentOne(e.target.value as PaymentMethod)}><option>Pix</option><option>Dinheiro</option><option>Débito</option><option>Crédito</option></select></label><label className="split-toggle"><input type="checkbox" checked={splitPayment} onChange={e=>setSplitPayment(e.target.checked)}/> Pagamento dividido</label></div>{splitPayment&&<div className="split-grid"><label>Valor na 1ª forma<input type="number" step=".01" value={paymentOneValue} onChange={e=>setPaymentOneValue(e.target.value)} placeholder="0,00"/></label><label>2ª forma<select value={paymentTwo} onChange={e=>setPaymentTwo(e.target.value as PaymentMethod)}><option>Dinheiro</option><option>Pix</option><option>Débito</option><option>Crédito</option></select></label><div>Restante automático<strong>{money(secondAmount)}</strong></div></div>}{cashPart>0&&<label>Valor recebido em dinheiro<input type="number" step=".01" value={cashReceived} onChange={e=>setCashReceived(e.target.value)} placeholder={money(cashPart)}/><small className="change-value">Troco: <b>{money(change)}</b></small></label>}</>}</div><button className="button primary full pos-finish" onClick={finishPosSale}>{pendingPayment?"Registrar pendência":"Finalizar venda"} • {money(posTotal)}</button></aside></div><article className="table-card sales-history"><div className="card-title"><div><h3>Histórico de vendas</h3><p className="muted-copy">Lucro individual, pagamentos e valores pendentes.</p></div><button onClick={()=>window.print()}>Exportar PDF</button></div><div className="table-wrap"><table><thead><tr><th>Venda</th><th>Data</th><th>Pagamento</th><th>Total</th><th>Lucro</th><th>Status</th></tr></thead><tbody>{sales.length?sales.map(s=><tr key={s.id}><td><strong>{s.id}</strong><small className="table-note">{s.items.map(i=>`${i.quantity}x ${i.name}`).join(", ")}</small></td><td>{new Date(s.createdAt).toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})}</td><td>{s.status==="Pendente"?`${s.customer} • vence ${s.dueDate?.split("-").reverse().join("/")}`:s.payments.map(p=>`${p.method} ${money(p.amount)}`).join(" + ")}</td><td>{money(s.revenue)}</td><td className="profit-cell">{money(s.profit)}</td><td><span className={`sale-status ${s.status==="Pendente"?"pending":""}`}>{s.status}</span></td></tr>):<tr><td colSpan={6} className="empty-sales">Nenhuma venda registrada ainda. Faça a primeira venda no PDV acima.</td></tr>}</tbody></table></div></article></>}
      {tab==="Produtos"&&<article className="table-card"><div className="card-title"><h3>Produtos e estoque</h3><button onClick={()=>openProduct(null)}>+ Novo produto</button></div><div className="table-wrap"><table><thead><tr><th>Código / Produto</th><th>Categoria</th><th>Custo</th><th>Venda</th><th>Estoque</th><th>Ações</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><strong>{p.code}</strong><small className="table-note">{p.name} • {p.brand}</small></td><td>{p.category}</td><td>{money(p.cost)}</td><td>{money(p.price)}</td><td>{p.stock} un.</td><td><div className="row-actions"><button onClick={()=>openProduct(p)}>Editar</button><button onClick={()=>{void removeProduct(p)}}>Excluir</button></div></td></tr>)}</tbody></table></div></article>}
      {tab==="Pedidos"&&<AdminTable title="Gestão de pedidos" action="Exportar" heads={["Pedido","Cliente","Total","Pagamento","Status"]} rows={[["AE-2048","Mariana S.","R$ 189,90","Pix","Pago"],["AE-2047","Joana R.","R$ 79,90","Pix","Em separação"],["AE-2046","Carlos M.","R$ 349,90","Pix","Saiu para entrega"]]}/>}
      {tab==="Clientes"&&<><div className="page-actions"><button className="button primary" onClick={()=>setEditor("message")}>Mensagem personalizada</button></div><AdminTable title="Clientes e aniversariantes" action="Exportar contatos" heads={["Cliente","WhatsApp","Compras","Preferência","Aniversário"]} rows={[["Mariana Silva","(98) 9 8844-1122","8","Perfumes","12/07"],["Joana Rocha","(98) 9 9123-7788","5","Presentes","23/07"],["Ana Luz","(98) 9 8455-2211","3","Chocolates","30/07"]]}/></>}
      {tab==="Promoções"&&<AdminTable title="Promoções, cupons e kits" action="+ Criar promoção" heads={["Cupom","Benefício","Produtos","Validade","Status"]} rows={[["BEMVINDA10","10% primeira compra","Todos","31/12/2026","Ativo"],["ANDORA15","15% fidelidade","Selecionados","Sem validade","Ativo"],["PRESENTE","Embalagem grátis","Kits","31/07/2026","Ativo"]]}/>}
      {tab==="Publicações"&&<article className="table-card"><div className="card-title"><div><h3>Campanhas da loja pública</h3><p className="muted-copy">Crie banners sazonais com foto, texto e período de exibição.</p></div><button onClick={()=>openPublication(null)}>+ Nova campanha</button></div><div className="publication-grid">{publications.map(p=><article key={p.id}>{p.image&&<div className="publication-thumb"><img src={p.image} alt=""/></div>}<span className="status">{p.active?"Publicada":"Rascunho"}</span><small>{p.theme}</small><h3>{p.title}</h3><p>{p.subtitle}</p><div className="row-actions"><button onClick={()=>{void togglePublication(p)}}>{p.active?"Ocultar":"Publicar"}</button><button onClick={()=>openPublication(p)}>Editar</button><button onClick={()=>{void removePublication(p)}}>Excluir</button></div></article>)}</div></article>}
      {tab==="Campanhas"&&<div className="campaign-admin"><article><span>WhatsApp marketing</span><h2>Fale com cada cliente do jeito certo.</h2><p>Segmente aniversariantes, preferências, clientes inativos ou histórico de compras. Use <b>{"{nome}"}</b> para personalizar.</p><button className="button primary" onClick={()=>setEditor("message")}>Criar mensagem</button></article><article className="campaign-list"><h3>Segmentos prontos</h3>{["Aniversariantes do mês • 12 clientes","Clientes de perfumes • 84 clientes","Sem comprar há 60 dias • 31 clientes","Clube fidelidade • 46 clientes"].map(x=><button key={x} onClick={()=>setEditor("message")}>{x}<Icon name="arrow"/></button>)}</article></div>}
      {tab==="Caixa e sangrias"&&<><div className="metric-grid">{[["Abertura","R$ 500,00","08:02"],["Entradas","R$ 4.386,50","38 vendas"],["Sangrias","R$ 620,00",`${withdrawals.length} registros`],["Saldo previsto","R$ 4.266,50","Caixa aberto"]].map(m=><article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><article className="table-card"><div className="card-title"><h3>Movimentações do caixa</h3><button onClick={()=>setEditor("withdrawal")}>+ Registrar sangria</button></div><div className="table-wrap"><table><thead><tr><th>Motivo</th><th>Horário</th><th>Responsável</th><th>Valor</th></tr></thead><tbody>{withdrawals.map(w=><tr key={w.id}><td>{w.reason}</td><td>{w.time}</td><td>Administrador</td><td>{money(w.amount)}</td></tr>)}</tbody></table></div></article></>}
      {tab==="Despesas"&&<><div className="page-actions"><button className="button primary" onClick={()=>setEditor("expense")}>+ Nova despesa</button></div><AdminTable title="Despesas fixas e variáveis" action="Exportar" heads={["Descrição","Categoria","Vencimento","Tipo","Valor"]} rows={expenses.map(x=>[x.description,x.category,x.date,x.recurring?"Recorrente":"Única",money(x.amount)])}/></>}
      {tab==="Relatórios"&&<><div className="metric-grid report-metrics">{[["Lucro por venda",sales.length?money(sales[0].profit):money(0),"Última venda"],["Lucro do dia",money(todayProfit),`${todaySales.length} vendas`],["Lucro do mês",money(monthProfit),`${monthSales.length} vendas`],["A receber",money(sales.filter(s=>s.status==="Pendente").reduce((sum,s)=>sum+s.revenue,0)),`${sales.filter(s=>s.status==="Pendente").length} pendências`]].map(m=><article key={m[0]}><span>{m[0]}</span><strong>{m[1]}</strong><small>{m[2]}</small></article>)}</div><div className="report-grid">{["Vendas e pagamentos por período","Lucro por venda, dia e mês","Pagamentos pendentes","Produtos mais vendidos","Estoque e reposição","Fluxo de caixa e sangrias","Despesas recorrentes","Clientes e aniversariantes"].map(r=><article key={r}><Icon name="arrow"/><h3>{r}</h3><p>Dados consolidados e prontos para impressão.</p><button onClick={()=>window.print()}>Gerar PDF</button></article>)}</div></>}
    </section>
    {editor&&<div className="admin-editor-backdrop" onMouseDown={()=>setEditor(null)}><section className="admin-editor" onMouseDown={e=>e.stopPropagation()}><button className="close" onClick={()=>setEditor(null)}><Icon name="x"/></button>
      {editor==="product"&&<form onSubmit={saveProduct}><span className="eyebrow">Catálogo inteligente</span><h2>{editingProduct?"Editar produto":"Cadastrar produto"}</h2><div className="product-media-editor"><div className="product-photo-preview">{productImage?<img src={productImage} alt="Prévia do produto"/>:<><Icon name="plus" size={30}/><strong>Foto do produto</strong><span>JPG, PNG ou WebP</span></>}</div><div><label className="upload-button">Escolher foto do aparelho<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseProductImage(e.target.files?.[0])}/></label><p>A imagem aparecerá automaticamente na vitrine. Para melhor resultado, use foto vertical e fundo limpo.</p><label>Ou cole uma URL<input name="image" value={productImage.startsWith("data:")?"":productImage} onChange={e=>setProductImage(e.target.value)} placeholder="https://..."/></label></div></div><div className="editor-fields"><label>Código do produto<input name="code" required defaultValue={editingProduct?.code} placeholder="AND-009"/></label><label>Nome do produto<input name="name" required defaultValue={editingProduct?.name}/></label><label>Categoria<select name="category" defaultValue={editingProduct?.category}>{categories.slice(1).map(c=><option key={c}>{c}</option>)}</select></label><label>Marca<input name="brand" defaultValue={editingProduct?.brand}/></label><label>Tipo / concentração<input name="type" defaultValue={editingProduct?.type}/></label><label>Custo de compra<input name="cost" type="number" step=".01" min="0" required defaultValue={editingProduct?.cost}/></label><label>Preço de venda<input name="price" type="number" step=".01" min="0" required defaultValue={editingProduct?.price}/></label><label>Preço anterior / promoção<input name="oldPrice" type="number" step=".01" defaultValue={editingProduct?.oldPrice}/></label><label>Estoque<input name="stock" type="number" min="0" required defaultValue={editingProduct?.stock}/></label><label>Selo da vitrine<input name="badge" defaultValue={editingProduct?.badge} placeholder="Lançamento, promoção..."/></label><label className="wide">Descrição<textarea name="description" required defaultValue={editingProduct?.description}/></label><label className="wide check-line"><input type="checkbox" name="adult" defaultChecked={editingProduct?.adult}/> Produto reservado para a área +18</label></div><button className="button primary full">Salvar e publicar na vitrine</button></form>}
      {editor==="publication"&&<form onSubmit={savePublication}><span className="eyebrow">Campanha visual</span><h2>{editingPublication?"Editar campanha":"Nova campanha"}</h2><div className="campaign-image-editor">{publicationImage?<div className="campaign-image-preview"><img src={publicationImage} alt="Prévia da campanha"/><button type="button" onClick={()=>setPublicationImage("")}>Remover foto</button></div>:<div className="campaign-upload-empty"><Icon name="plus" size={28}/><strong>Foto da campanha</strong><span>Opcional • JPG, PNG ou WebP</span></div>}<div><label className="upload-button">Escolher foto do celular ou computador<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseCampaignImage(e.target.files?.[0],"publication")}/></label><p>Use uma foto horizontal ou vertical com boa luz. O site ajusta o enquadramento sem deixar o banner confuso.</p></div></div><div className="editor-fields"><label>Tema<select name="theme" defaultValue={editingPublication?.theme}><option>Dia das Mães</option><option>Dia dos Pais</option><option>Dia dos Namorados</option><option>Natal</option><option>Campanha personalizada</option></select></label><label>Título<input name="title" required defaultValue={editingPublication?.title}/></label><label className="wide">Texto<textarea name="subtitle" required defaultValue={editingPublication?.subtitle}/></label><label>Início<input type="date" name="startsAt" defaultValue={editingPublication?.startsAt}/></label><label>Fim<input type="date" name="endsAt" defaultValue={editingPublication?.endsAt}/></label><label className="wide check-line"><input type="checkbox" name="active" defaultChecked={editingPublication?.active??true}/> Publicar agora</label></div><button className="button primary full">Salvar campanha</button></form>}
      {editor==="expense"&&<form onSubmit={saveExpense}><span className="eyebrow">Financeiro</span><h2>Lançar despesa</h2><div className="editor-fields"><label className="wide">Descrição<input name="description" required/></label><label>Categoria<select name="category"><option>Estoque</option><option>Serviços</option><option>Logística</option><option>Marketing</option></select></label><label>Valor<input name="amount" type="number" step=".01" required/></label><label>Vencimento<input name="date" type="date" required/></label><label className="check-line"><input name="recurring" type="checkbox"/> Repetir mensalmente</label></div><button className="button primary full">Registrar despesa</button></form>}
      {editor==="withdrawal"&&<form onSubmit={saveWithdrawal}><span className="eyebrow">Controle de caixa</span><h2>Registrar sangria</h2><label>Motivo<input name="reason" required/></label><label>Valor<input name="amount" type="number" step=".01" required/></label><button className="button primary full">Confirmar sangria</button></form>}
      {editor==="message"&&<div><span className="eyebrow">Relacionamento</span><h2>Mensagem personalizada</h2><label>Público<select><option>Aniversariantes do mês</option><option>Todos que aceitaram promoções</option><option>Clientes de perfumes</option><option>Clientes inativos</option></select></label><div className="message-media">{messageImage?<div><img src={messageImage} alt="Imagem da campanha"/><button onClick={()=>setMessageImage("")}>Remover</button></div>:<label className="upload-button">Adicionar foto à campanha<input type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>chooseCampaignImage(e.target.files?.[0],"message")}/></label>}</div><label>Mensagem<textarea className="message-box" value={message} onChange={e=>setMessage(e.target.value)}/></label><div className="message-preview">{messageImage&&<img src={messageImage} alt=""/>}<small>Prévia para Mariana</small><p>{message.replace("{nome}","Mariana")}</p></div><button className="button primary full" onClick={()=>{alert("Campanha preparada. O envio oficial será ativado na integração do WhatsApp.");setEditor(null)}}>Preparar envios</button></div>}
    </section></div>}
  </div>
}
