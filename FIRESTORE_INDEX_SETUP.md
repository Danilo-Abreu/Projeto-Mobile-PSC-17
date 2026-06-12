# Configurar Índice Composto no Firestore

## ❌ Problema
Erro: **"The query requires an index"**

Isso acontece porque a query para verificar disponibilidade do psicólogo usa múltiplos campos.

---

## ✅ Solução Rápida (Automática)

### Opção 1: Clicar no Link de Erro (RECOMENDADO)

Na mensagem de erro, você verá um link azul que começa com:
```
https://console.firebase.google.com/...
```

**Simplesmente CLIQUE nesse link** — ele vai:
1. ✅ Abrir o Firebase Console automaticamente
2. ✅ Pré-preenchido com o índice necessário
3. ✅ Você apenas clica **"Create Index"**

Pronto! O índice será criado em ~1 minuto.

---

## ✅ Solução Manual (Se o Link Não Funcionar)

### Passo 1: Acesse Firebase Console

1. Abra: https://console.firebase.google.com
2. Selecione: **projetomobile-860f3**
3. No menu: **Firestore Database**
4. Aba: **Indexes** (ou "Índices")

### Passo 2: Criar Índice Composto

Clique em **"Create Index"** e preencha assim:

| Campo | Valor |
|-------|-------|
| **Collection** | `agendamentos` |
| **Query Scope** | Ascending (ou padrão) |

**Adicione os campos:**

| Campo | Tipo | Ordem |
|-------|------|-------|
| `psicologoEmail` | String | Ascending |
| `dataHora` | Timestamp | Ascending |

Clique em **"Create Index"**

---

## ⏱️ Tempo de Criação

O índice leva **1-2 minutos** para ser criado.

Você verá o status mudar de:
```
Building...  ⟳
```

Para:
```
✅ Enabled
```

---

## ✅ Após Criar o Índice

1. **Volte para o app** (`http://localhost:4200`)
2. **Recarregue a página** (F5)
3. **Teste o agendamento novamente**

Agora deve funcionar! ✅

---

## 📋 Outros Índices Que Podem Ser Necessários

Se receber mais erros de índice, siga o mesmo processo.

Índices comuns no projeto:
- `agendamentos`: `psicologoEmail` + `dataHora`
- `agendamentos`: `pacienteEmail` + `dataHora`
- `usuarios`: (qualquer query com múltiplos `where`)

---

## 🔍 Debug

Se o índice já existir e o erro persistir:
1. Abra **DevTools (F12)**
2. Aba **Application → Local Storage**
3. Procure por `google_calendar_*` e limpe
4. Recarregue a página

---

## 📞 Próximos Passos

1. ✅ Procure a mensagem de erro com o link azul
2. ✅ Clique no link (ou siga o processo manual)
3. ✅ Aguarde ~2 minutos
4. ✅ Recarregue o app e teste

Avisa quando conseguir! 🚀
