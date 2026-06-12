# Configuração do Google Calendar OAuth - Guia Passo a Passo

## ❌ Problema Atual
**"localhost foi recusado"** — Significa que o servidor de desenvolvimento NÃO está rodando em `localhost:4200`.

---

## ✅ Passo 1: Iniciar o Servidor de Desenvolvimento

Abra um terminal PowerShell **NOVO** (importante: não use o terminal que fechou) e execute:

```powershell
cd C:\Users\danil\cartao\Projeto-Mobile-PSC-17
npm start
```

Ou alternativamente:

```powershell
npm run dev
```

Você deve ver mensagens como:
```
✔ Compiled successfully.
✔ Browser application bundle generation complete.

  Local:            http://localhost:4200
```

**Deixe este terminal ABERTO** enquanto trabalha.

---

## ✅ Passo 2: Verificar Google Cloud Console

Você **PRECISA** registrar a URL de callback no Google Cloud Console:

1. Acesse: https://console.cloud.google.com
2. Selecione seu projeto: **projetomobile-860f3**
3. Vá para: **APIs & Services → Credentials**
4. Clique no OAuth Client: `867516668325-...`
5. Em **Authorized redirect URIs**, adicione EXATAMENTE:
   - `http://localhost:4200/google-oauth-callback` (para desenvolvimento)
   - `https://projetomobile-860f3.firebaseapp.com/google-oauth-callback` (para produção)
6. Clique **SAVE**

⚠️ **CRÍTICO**: A URL no Google Cloud deve ser idêntica à URL em seu código.

---

## ✅ Passo 3: Abrir Navegador e Agendar Consulta

1. Abra seu navegador em: `http://localhost:4200`
2. Faça login como paciente
3. Selecione um psicólogo
4. Clique em **"Agendar Consulta"**
5. Clique em **"Conectar Google Agenda"** (ou similar)

Você deve ser redirecionado para o Google Login.

---

## 📋 Fluxo Esperado

1. **Seu aplicativo** → Clica "Conectar Google"
2. **Seu aplicativo** → Redireciona para `https://accounts.google.com/o/oauth2/v2/auth?...`
3. **Google** → Você faz login e autoriza permissões
4. **Google** → Redireciona para `http://localhost:4200/google-oauth-callback?code=...`
5. **Seu aplicativo** → Página `/google-oauth-callback` processa o código
6. **Seu aplicativo** → Faz requisição para `https://oauth2.googleapis.com/token` para obter token
7. **Google** → Retorna `access_token` e `refresh_token`
8. **Seu aplicativo** → Salva tokens no `localStorage`
9. **Seu aplicativo** → Redireciona de volta para agendamento

---

## 🔍 Debug: Verificar Console do Navegador

Depois de clicar em "Conectar Google Agenda", abra o **DevTools do Navegador** (F12) e vá para **Console** para ver os logs:

```
✓ Iniciando autorização do Google Calendar
  Client ID: REPLACE_WITH_GOOGLE_CLIENT_ID
  📍 Usando Redirect URI configurado: http://localhost:4200/google-oauth-callback
  Scope: https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly
```

Se você ver erro:
```
✗ ERRO: Servidor de desenvolvimento não está respondendo em http://localhost:4200
✗ Abra um terminal e execute: npm start
```

→ **Inicie o servidor** com `npm start`

---

## 🚨 Erros Comuns

### "localhost foi recusado"
→ Execute `npm start` em um terminal novo

### "Não foi possível acessar localhost:4200"
→ Verifique se há firewall bloqueando a porta 4200
→ Tente: `netstat -ano | findstr :4200`

### "Erro de redirecionamento inválido"
→ A URL em Google Cloud Console NÃO corresponde ao código
→ Copie exatamente: `http://localhost:4200/google-oauth-callback`

### "Token inválido ou expirado"
→ Abra `DevTools > Application > Local Storage`
→ Limpe todos os dados: `google_calendar_*`
→ Tente conectar novamente

---

## ✅ Ambiente Configurado

```
environment.ts:
  clientId: REPLACE_WITH_GOOGLE_CLIENT_ID
  redirectUri: http://localhost:4200/google-oauth-callback
  
environment.prod.ts:
  clientId: REPLACE_WITH_GOOGLE_CLIENT_ID
  redirectUri: https://projetomobile-860f3.firebaseapp.com/google-oauth-callback
```

---

## 📞 Próximas Ações

1. Inicie o servidor: `npm start`
2. Abra navegador em `http://localhost:4200`
3. Reproduza o fluxo de agendamento
4. Cole aqui os erros que aparecer no console (F12)

Vou estar aguardando!
