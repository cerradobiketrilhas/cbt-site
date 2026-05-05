# 📋 Página de Inscrição - Guia de Configuração

> Baseline oficial de segurança: `SECURITY_BASELINE_2026-05.md` (fonte única de verdade).

Este documento explica como usar e configurar a página de inscrição do CBT com pagamento via Mercado Pago.

## 🚀 O que foi implementado

### Páginas
- **`inscricao.html`** - Formulário de inscrição com 7 campos
- **`confirmacao.html`** - Página de confirmação após pagamento

### Scripts Frontend
- **`script-inscription.js`** - Lógica de formulário, validação e integração Mercado Pago
- **`script-confirmation.js`** - Exibe dados da inscrição confirmada

### API Backend (Vercel Functions)
- **`api/create-preference.js`** - Cria preferência de pagamento no Mercado Pago
- **`api/confirm-inscription.js`** - Webhook que recebe confirmação e salva no Firebase

### Configuração
- **`package.json`** - Dependências (mercadopago, firebase)
- **`.env.example`** - Variáveis de ambiente necessárias
- **`config.json`** - Dados do evento (atualizável)

---

## ⚙️ Configuração Rápida (Vercel)

### 1. Adicionar variáveis de ambiente no Vercel

1. Acesse https://vercel.com/
2. Vá para seu projeto `cbt-site`
3. Clique em **Settings** → **Environment Variables**
4. Adicione as seguintes variáveis:

```
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...   # produção
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...     # produção (apenas frontend quando necessário)
MERCADO_PAGO_WEBHOOK_SECRET=...         # segredo de validação x-signature
PUBLIC_SITE_BASE_URL=https://seu-dominio.com.br
ALLOWED_ORIGINS=https://seu-dominio.com.br,https://www.seu-dominio.com.br
```

**Notas:**
- Para produção, gerar credenciais reais em https://www.mercadopago.com.br/account/credentials
- O `ACCESS_TOKEN` é privado e não deve ser exposto ao cliente

### 2. Firebase (já configurado para teste)

As credenciais do Firebase já estão no código (são credenciais de teste):
- Acedem apenas ao projeto `cbt-inscricoes` em modo sandbox
- Não precisa de env vars adicionais (seguro porque é Firebase Firestore com regras de segurança)

### 3. Fazer deploy no Vercel

```bash
# Se já está configurado git
git push origin main

# Vercel faz deploy automático quando você faz push para main
```

---

## 📝 Campos do Formulário

| Campo | Tipo | Validação | Exemplo |
|-------|------|-----------|---------|
| Nome completo | Text | Min 3 caracteres | "João Silva" |
| E-mail | Email | Formato válido | "joao@email.com" |
| CPF | Text | 11 dígitos + dígitos verificadores | "123.456.789-00" |
| Data de nascimento | Date | Após 1946, antes de hoje | "1990-05-15" |
| Telefone | Tel | Min 10 dígitos | "(61) 99999-9999" |
| Cidade / Estado | Text | Min 3 caracteres | "Brasília, DF" |
| Categoria | Select | Uma das 5 opções | "Elite", "Sport", etc. |

---

## 🔄 Fluxo de Inscrição

```
1. Usuário acessa /inscricao.html
   ↓
2. Preenche formulário (validação em tempo real)
   ↓
3. Clica "Confirmar Inscrição e Pagar R$ 80"
   ↓
4. Frontend chama POST /api/create-preference
   ↓
5. Backend cria preferência no Mercado Pago
   ↓
6. Backend retorna URL de checkout
   ↓
7. Usuário é redirecionado para Mercado Pago
   ↓
8. Usuário completa pagamento
   ↓
9. Mercado Pago redireciona para /confirmacao.html
   ↓
10. Mercado Pago envia webhook POST /api/confirm-inscription
    ↓
11. Backend valida e salva no Firebase Firestore
    ↓
12. Frontend exibe dados confirmados
```

---

## 💳 Testando com Mercado Pago (Sandbox)

### Cartão de teste (Visa)
```
Número: 4235 6477 2802 5682
Vencimento: 12/25
CVV: 123
```

### Outros cartões de teste
- **Mastercard**: 5031 7557 3453 0604
- **Amex**: 3711 803012 34567

Consulte: https://www.mercadopago.com.br/developers/pt-BR/guides/resources/localization/payments

---

## 🗄️ Dados no Firebase Firestore

Quando uma inscrição é confirmada, os dados são salvos em `cbt-inscricoes` → `inscricoes` com a seguinte estrutura:

```json
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "cpf": "12345678900",
  "dataNasc": "1990-05-15",
  "telefone": "61999999999",
  "cidade": "Brasília, DF",
  "categoria": "elite",
  "status": "confirmado",
  "idPagamento": "123456789",
  "valor": 80,
  "dataPagamento": Timestamp(2026-04-29 15:30:00),
  "referencia": "inscricao_12345678900_1234567890",
  "metodo": "credit_card",
  "timestamp": "2026-04-29T15:30:00Z"
}
```

**Acessar no Firebase Console:**
1. https://console.firebase.google.com/
2. Selecione projeto `cbt-inscricoes`
3. Firestore Database
4. Collection `inscricoes`

---

## 📊 Google Analytics 4

Os seguintes eventos são rastreados:

| Evento | Quando | Contexto |
|--------|--------|---------|
| `view_event_page` | Ao acessar /inscricao.html | Categoria do evento |
| `form_submit` | Ao submeter formulário | Categoria selecionada |
| `payment_start` | Antes de redirecionar para MP | N/A |
| `payment_complete` | Ao acessar /confirmacao.html | N/A |

**Verificar em Google Analytics:**
1. https://analytics.google.com/
2. Propriedade do CBT
3. Tempo real → Eventos

---

## 🔐 Segurança

### ✅ Implementado
- **Access Token privado**: Armazenado apenas em variáveis de ambiente do Vercel
- **Validação no servidor**: Dados validados antes de enviar para Mercado Pago
- **Firebase Firestore Rules**: Apenas webhook pode gravar (leitura aberta para admin)
- **CORS**: API aceita requisições apenas do domínio CBT
- **Validação de CPF**: Dígitos verificadores validados no client e server
- **HTTPS**: Obrigatório em produção
- **Gas Analytics**: Rastreia eventos para detecção de fraude

### ⚠️ Ainda não implementado
- Notificação por email (pode usar SendGrid/Brevo/Resend)
- Admin dashboard para visualizar inscrições
- Cookies de sessão `HttpOnly + Secure + SameSite=Strict` (se houver autenticação)
- CSRF token formal para operações state-changing baseadas em sessão

---

## 🐛 Troubleshooting

### "Erro ao processar inscrição"
- Verifique se as variáveis de ambiente estão configuradas no Vercel
- Verifique logs em Vercel → Deployments → Logs

### Webhook não é recebido
- Mercado Pago precisa de HTTPS (não funciona com localhost http)
- Verifique URL de notificação: deve ser `https://seu-dominio.com/api/confirm-inscription`
- Teste manualmente: https://webhook.site/

### Dados não aparecem no Firebase
- Verifique credenciais do Firebase em `api/confirm-inscription.js`
- Verifique Firestore Rules (permitir create na collection `inscricoes`)
- Verifique status da preferência no Mercado Pago Dashboard

### Formulário não valida CPF
- CPF deve ter exatamente 11 dígitos
- Validação de dígitos verificadores é feita localmente
- Se passar local, é enviado ao servidor para validação final

---

## 📱 Responsividade

A página é totalmente responsiva:
- ✅ Desktop (1920px+)
- ✅ Tablet (768px-1024px)
- ✅ Mobile (320px-767px)

Testado com:
- Chrome DevTools (device simulation)
- Safari iOS
- Firefox Mobile

---

## 🚀 Próximos Passos (Opcional)

1. **Email de confirmação**: Integrar com SendGrid/Brevo
2. **Admin Dashboard**: Criar `/admin/` para visualizar inscrições
3. **Event Schema**: Adicionar schema JSON-LD completo
4. **Notificação em tempo real**: Integrar Firebase Realtime
5. **SMS de confirmação**: Twilio ou similar
6. **Relatório de inscricoes**: Exportar para CSV/Excel

---

## 📞 Suporte

Para dúvidas sobre configuração:
- Mercado Pago: https://www.mercadopago.com.br/developers/
- Firebase: https://firebase.google.com/docs
- Vercel: https://vercel.com/docs

---

**Última atualização:** 29 de abril de 2026
**Versão:** 1.0.0
