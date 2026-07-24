# Andora Essence

Loja virtual premium para perfumes, chocolates, presentes, cosméticos e uma Linha Íntima +18 discreta.

## O que já está implementado

- Página inicial responsiva com fotos reais e identidade oficial.
- Catálogo com busca, categorias, preço, promoções e favoritos.
- Carrinho persistente no navegador, embalagem e mensagem para presente.
- Checkout com retirada/entrega, taxa por localidade, Pix demonstrativo e resumo para WhatsApp.
- Cadastro do Clube Andora, preferências e fidelidade.
- Confirmação de idade para a área +18.
- Painel administrativo privado com Supabase Auth.
- Cadastro de produtos e campanhas com upload de imagens no Supabase Storage.
- PDV com Pix, débito, crédito, dinheiro, pagamento dividido, troco e pendências.
- Baixa transacional de estoque e lucro por venda, dia e mês.
- Despesas, recorrências, sangrias e histórico centralizados no banco.
- SEO básico, acessibilidade de controles e layout para celular/computador.

## Rodar localmente

```bash
npm install
npm run dev
```

## Ativar o Supabase

1. Execute `supabase/schema.sql` no SQL Editor do projeto.
2. Copie `.env.example` para `.env.local` e preencha as chaves.
3. Em `/admin`, use “Primeiro acesso” com `andoraessence@gmail.com` e uma senha exclusiva para o painel.
4. Confirme o e-mail e entre novamente.
5. Ative MFA no Supabase Auth antes de liberar o painel para operação diária.

## Segurança antes da publicação

- As políticas RLS e a função transacional do PDV são criadas pelo schema.
- Manter a `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- Validar preço, estoque, cupom e taxa de entrega novamente no servidor.
- Registrar webhooks Pix com verificação de assinatura e idempotência.
- Aplicar consentimento LGPD para promoções via WhatsApp.
- Revisar políticas de privacidade, troca, entrega e conteúdo +18 com os dados reais da loja.
