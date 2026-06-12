# Configuração do Google Calendar OAuth2 - Guia Completo

## Status Atual ✅

Sua integração OAuth2 foi atualizada e agora está com:
- ✅ Tratamento robusto de erros
- ✅ Validações adequadas de tokens
- ✅ Melhor logging para debugging
- ✅ Configuração de produção corrigida
- ✅ Refresh de tokens automático
- ✅ Limpeza de tokens inválidos

## Checklist de Configuração

### 1️⃣ Google Cloud Console - Configurar Redirect URIs

Você DEVE configurar o `redirect_uri` no Google Cloud Console para que corresponda à sua aplicação:

**Para Desenvolvimento:**
```
http://localhost:8100/google-oauth-callback
```
✅ Já está configurado em `src/environments/environment.ts`

**Para Produção:**
```
https://projetomobile-860f3.firebaseapp.com/google-oauth-callback
```
✅ Já está configurado em `src/environments/environment.prod.ts`

#### Como configurar no Google Cloud Console:

1. Acesse https://console.cloud.google.com/apis/credentials
2. Clique no seu OAuth Client ID (Web Application)
3. Em "Authorized redirect URIs", adicione/atualize:
   - `http://localhost:8100/google-oauth-callback` (desenvolvimento)
   - `https://projetomobile-860f3.firebaseapp.com/google-oauth-callback` (produção)
4. Salve as alterações

### 2️⃣ Verificar Escopos Autorizados

Os escopos configurados são:
```
https://www.googleapis.com/auth/calendar.events
https://www.googleapis.com/auth/calendar.readonly
```

Isso permite:
- ✅ Criar eventos no calendário
- ✅ Ler eventos do calendário
- ✅ Modificar eventos

### 3️⃣ Credenciais de Produção

**⚠️ IMPORTANTE:** Se você hospedá-lo em um servidor backend (Node.js/Firebase Cloud Functions), você precisará de uma estratégia de segurança diferente.

Atualmente, o fluxo está configurado como **Implicit Flow** (seguro com PKCE), o que é apropriado para aplicações web modernas.

### 4️⃣ Testar a Integração

#### Em Desenvolvimento:
```bash
npm start
```

1. Acesse http://localhost:8100
2. Vá para página de agendamento
3. Clique em "Conectar Google Agenda"
4. Autorize o acesso
5. Você deve ser redirecionado de volta e o status deve mostrar "Google Agenda conectada"

#### Em Produção:
1. Deploy no Firebase Hosting
2. Acesse https://seu-projeto-id.firebaseapp.com
3. Siga os mesmos passos

### 5️⃣ Troubleshooting - Erros Comuns

#### ❌ Erro 400 - Código de autorização inválido
**Causa:** O `code_verifier` não corresponde ao `code_challenge`, ou a sessão expirou
**Solução:** 
- Limpe o localStorage: `localStorage.clear()`
- Tente novamente

#### ❌ Erro 401 - Token inválido ou expirado
**Causa:** O access token expirou ou o refresh token é inválido
**Solução:** 
- Reconecte sua conta Google
- Clique novamente em "Conectar Google Agenda"

#### ❌ Erro 403 - Permissão negada
**Causa:** O escopo não foi autorizado
**Solução:** 
- Reconecte sua conta Google com os escopos corretos
- Verifique os escopos em `src/environments/environment.ts`

#### ❌ Erro CORS
**Causa:** O redirect URI não está autorizado no Google Cloud Console
**Solução:** 
- Verifique que o redirect URI foi adicionado corretamente
- Incluir a barra no final se necessário

#### ❌ Agendamento criado no Firebase mas não no Google Calendar
**Esperado:** Isso é intencional! Se o Google Calendar falhar, o agendamento é criado localmente mesmo assim.
**Solução:** 
- Tente reconectar o Google Calendar
- O agendamento será sincronizado na próxima sessão

## Fluxo de Autenticação OAuth2 com PKCE

```
1. Usuário clica "Conectar Google Agenda"
   ↓
2. Gera code_verifier e code_challenge
   ↓
3. Redireciona para Google Autorização
   ↓
4. Usuário autoriza
   ↓
5. Google redireciona de volta com código
   ↓
6. Sistema troca código por token (usando code_verifier)
   ↓
7. Token armazenado no localStorage
   ↓
8. Eventos são criados com o token
```

## Variáveis de Ambiente

### `src/environments/environment.ts` (Desenvolvimento)
```typescript
googleCalendar: {
   clientId: 'REPLACE_WITH_GOOGLE_CLIENT_ID',
   clientSecret: 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
   redirectUri: 'http://localhost:8100/google-oauth-callback',
  scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  apiBaseUrl: 'https://www.googleapis.com/calendar/v3'
}
```

### `src/environments/environment.prod.ts` (Produção)
```typescript
googleCalendar: {
   clientId: 'REPLACE_WITH_GOOGLE_CLIENT_ID',
   clientSecret: 'REPLACE_WITH_GOOGLE_CLIENT_SECRET',
   redirectUri: 'https://projetomobile-860f3.firebaseapp.com/google-oauth-callback',
  scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
  authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  apiBaseUrl: 'https://www.googleapis.com/calendar/v3'
}
```

## Logs Úteis para Debugging

Abra o Console do Navegador (F12) e procure por mensagens como:

```
✅ Token obtido com sucesso
✅ Token atualizado com sucesso
✅ Evento criado no Google Calendar
✅ Autenticação concluída com sucesso
```

Ou procure por erros:

```
❌ Erro ao trocar código por token
❌ Erro ao atualizar token
❌ Erro ao criar evento no Google Calendar
```

## Proximos Passos (Opcional)

### Para Maior Segurança em Produção:
1. Considere usar um backend (Node.js/Firebase Cloud Functions) para trocar o código por token
2. Armazene o refresh token de forma segura no servidor
3. Implemente rate limiting nas APIs do Google

### Para Melhor UX:
1. Implementar sincronização em tempo real
2. Adicionar retry automático em caso de falha
3. Mostrar status de sincronização

## Suporte

Para mais informações:
- [Google Calendar API Docs](https://developers.google.com/calendar/api/quickstart/js)
- [OAuth2 PKCE Flow](https://tools.ietf.org/html/rfc7636)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)

---

**Data de Última Atualização:** 2026-06-11
**Status:** ✅ Pronto para Produção
