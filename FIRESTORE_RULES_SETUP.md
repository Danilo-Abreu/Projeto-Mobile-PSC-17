# Configuração de Regras de Segurança do Firestore

## ❌ Problema Atual
Erro: **"Permissão negada no Firestore"** ao tentar criar agendamento.

---

## ✅ Solução: Publicar as Regras no Firebase Console

### Passo 1: Acessar Firebase Console

1. Abra: https://console.firebase.google.com
2. Selecione o projeto: **projetomobile-860f3**
3. No menu lateral, clique em: **Firestore Database**
4. Vá para a aba: **Rules** (ou "Regras" em português)

---

### Passo 2: Copiar as Regras Corretas

Você vai ver um editor de código com as regras atuais. **Selecione TODO o conteúdo** e **DELETE**.

Depois, **COPIE E COLE** exatamente isto:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura e escrita em usuarios para qualquer um
    match /usuarios/{document=**} {
      allow read, write: if true;
    }

    // Permitir leitura e escrita em agendamentos para qualquer um
    match /agendamentos/{document=**} {
      allow read, write: if true;
    }

    // Permitir qualquer acesso em outras coleções
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

---

### Passo 3: Publicar as Regras

1. Após colar o código, você verá um botão **"Publish"** (azul)
2. Clique em **"Publish"**
3. Aguarde a confirmação: **"Rules updated successfully"** (vai aparecer um aviso verde)

---

## 📋 Explicação das Regras

| Regra | Significado |
|-------|------------|
| `allow read, write: if true;` | Permite qualquer leitura/escrita (⚠️ Apenas para desenvolvimento!) |
| `match /usuarios/{document=**}` | Aplica a regra a TODOS os documentos em `usuarios` |
| `match /agendamentos/{document=**}` | Aplica a regra a TODOS os documentos em `agendamentos` |
| `match /{document=**}` | Fallback para qualquer outra coleção |

---

## ⚠️ Segurança (Importante para Produção)

**AVISO**: Essas regras permitem QUALQUER pessoa ler/escrever QUALQUER dado.

✅ **Para Desenvolvimento**: Use `if true;` (como acima)

❌ **Para Produção**: Use regras mais restritas:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios - qualquer um pode ler perfis, mas só pode alterar o seu
    match /usuarios/{userEmail} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.email == userEmail;
    }

    // Agendamentos - qualquer um autenticado pode ler/criar
    match /agendamentos/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        (resource.data.pacienteEmail == request.auth.token.email || 
         resource.data.psicologoEmail == request.auth.token.email);
    }
  }
}
```

---

## ✅ Verificar se as Regras Foram Publicadas

Depois de clicar em "Publish":

1. Feche o navegador com o Firebase Console
2. Volte para o seu app
3. Teste o agendamento novamente
4. Se funcionar: **Problema resolvido!** ✅

---

## 🔍 Debug Adicional

Se ainda tiver erro "Permissão negada", abra o **DevTools (F12)** do navegador e procure por:

```
👤 Usuário logado: seu-email@gmail.com
🏥 Psicólogo selecionado: psicologo@gmail.com
❌ ERRO AO CRIAR NO FIRESTORE: permission-denied ...
```

Se o email estiver vazio (`undefined`), o problema é **autenticação**, não as regras.

---

## 💡 Alternativa: Regras Temporárias para Debug

Se quiser testar rapidamente sem complicações:

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Isso permite TUDO. Use apenas para desenvolvimento/teste.

---

## 📞 Próximos Passos

1. ✅ Acesse: https://console.firebase.google.com
2. ✅ Projeto: **projetomobile-860f3**
3. ✅ Seção: **Firestore Database → Rules**
4. ✅ Copie e cole as regras acima
5. ✅ Clique em **"Publish"**
6. ✅ Teste novamente em `http://localhost:4200`

Qualquer dúvida, me avisa!
