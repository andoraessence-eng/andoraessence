# Andora Essence

Loja virtual premium para perfumes, chocolates, presentes, cosméticos e uma Linha Íntima +18 discreta.

## O que já está implementado

- Página inicial responsiva com fotos reais e identidade oficial.
- Catálogo com busca, categorias, preço, promoções e favoritos.
- Carrinho persistente no navegador, embalagem e mensagem para presente.
- Checkout com retirada/entrega, taxa por localidade, Pix demonstrativo e resumo para WhatsApp.
- Cadastro do Clube Andora, preferências e fidelidade.
- Confirmação de idade para a área +18.
- Painel administrativo demonstrativo: visão geral, produtos, pedidos, clientes, promoções, financeiro e relatórios.
- SEO básico, acessibilidade de controles e layout para celular/computador.

## Rodar localmente

```bash
npm install
npm run dev
```

## Integrações finais

1. Crie o projeto no Supabase e execute `supabase/schema.sql`.
2. Copie `.env.example` para `.env.local` e preencha as chaves.
3. Substitua os dados demonstrativos de `app/page.tsx` por consultas ao Supabase.
4. Configure autenticação administrativa no Supabase Auth com MFA.
5. Integre um provedor Pix que ofereça webhook; nunca considere o pagamento aprovado apenas pela tela do cliente.
6. Suba o repositório Git e conecte-o à hospedagem escolhida.

## Segurança antes da publicação

- Criar políticas RLS específicas para cliente e administrador.
- Manter a `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- Validar preço, estoque, cupom e taxa de entrega novamente no servidor.
- Registrar webhooks Pix com verificação de assinatura e idempotência.
- Aplicar consentimento LGPD para promoções via WhatsApp.
- Revisar políticas de privacidade, troca, entrega e conteúdo +18 com os dados reais da loja.
