# 📋 INSTRUÇÕES COMPLETAS: INSTALAÇÃO DO BANCO DE DADOS

## 🎯 Objetivo
Configurar todas as tabelas e estruturas necessárias no Supabase para que o sistema **OBREASY** salve todos os dados corretamente no banco de dados.

---

## 📊 O que será criado

### **10 Tabelas Principais:**
1. ✅ **user_profiles** - Perfis complementares dos usuários
2. ✅ **obras** - Projetos de construção/reforma gerenciados
3. ✅ **despesas** - Registros de despesas (materiais, mão de obra, etc)
4. ✅ **profissionais** - Cadastro de profissionais e fornecedores
5. ✅ **pagamentos** - Histórico de pagamentos para profissionais
6. ✅ **recebimentos** - Recebimentos de valores do cliente
7. ✅ **alertas_orcamento** - Configuração de alertas de orçamento
8. ✅ **alertas_prazo** - Alertas de datas importantes
9. ✅ **alertas_pagamento** - Lembretes de pagamentos recorrentes
10. ✅ **notificacoes** - Histórico de notificações do sistema

### **Recursos Adicionais:**
- ✅ Row Level Security (RLS) em todas as tabelas
- ✅ Índices para performance otimizada
- ✅ Triggers automáticos para atualização de timestamps
- ✅ Políticas de acesso (cada usuário vê apenas seus dados)
- ✅ Bucket de storage para comprovantes (PDFs e imagens)

---

## 🚀 PASSO A PASSO

### **ETAPA 1: Executar Script Principal do Banco de Dados**

1. **Acesse o Supabase Dashboard:**
   ```
   URL: https://blietvjzchjrzbmkitha.supabase.co
   ```

2. **Faça login** com suas credenciais do Supabase

3. **Vá para o SQL Editor:**
   - Clique em **"SQL Editor"** no menu lateral esquerdo
   - Clique em **"New query"** (Nova consulta)

4. **Cole o conteúdo do arquivo:**
   ```
   SCHEMA_COMPLETO_SUPABASE.sql
   ```
   📁 Localização: `E:\PROJETOS LASY\apps-4997\joaojrsilva\project\SCHEMA_COMPLETO_SUPABASE.sql`

5. **Execute o script:**
   - Clique no botão **"Run"** (Executar) no canto inferior direito
   - Aguarde a confirmação de sucesso (✅ Success)

6. **Verifique se as tabelas foram criadas:**
   - Vá em **"Table Editor"** no menu lateral
   - Você deve ver todas as 10 tabelas listadas

---

### **ETAPA 2: Configurar Bucket de Storage (Comprovantes)**

1. **Vá para Storage:**
   - Clique em **"Storage"** no menu lateral esquerdo

2. **Crie um novo bucket:**
   - Clique em **"Create a new bucket"**
   - Preencha os campos:
     - **Name:** `comprovantes`
     - **Public bucket:** ✅ **YES** (marque esta opção)
     - **File size limit:** `10` MB
     - **Allowed MIME types:** `image/jpeg,image/png,application/pdf`
   - Clique em **"Create bucket"**

3. **Configure as políticas do bucket:**
   - Volte ao **SQL Editor**
   - Clique em **"New query"**
   - Cole o conteúdo do arquivo:
     ```
     CONFIGURAR_STORAGE.sql
     ```
     📁 Localização: `E:\PROJETOS LASY\apps-4997\joaojrsilva\project\CONFIGURAR_STORAGE.sql`
   - Clique em **"Run"** (Executar)
   - Aguarde confirmação de sucesso

---

### **ETAPA 3: Verificar Configurações do Projeto**

1. **Verifique o arquivo .env:**
   - Abra o arquivo: `E:\PROJETOS LASY\apps-4997\joaojrsilva\project\.env`
   - Confirme se as variáveis estão corretas:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://blietvjzchjrzbmkitha.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

2. **Reinicie o servidor de desenvolvimento:**
   - Abra o terminal no diretório do projeto
   - Execute:
     ```bash
     npm run dev
     ```

---

## ✅ VERIFICAÇÃO FINAL

### **1. Teste a Conexão com o Banco:**
- Acesse: http://localhost:3000/test-supabase
- Você deve ver uma mensagem de conexão bem-sucedida

### **2. Teste o Cadastro de Dados:**
- Faça login no sistema
- Tente criar uma nova obra
- Adicione uma despesa
- Cadastre um profissional
- **Todos os dados devem ser salvos no banco de dados Supabase**

### **3. Verifique no Supabase:**
- Vá em **"Table Editor"** no Supabase Dashboard
- Clique em cada tabela (obras, despesas, profissionais, etc)
- Você deve ver os dados que cadastrou no sistema

---

## 📦 ESTRUTURA COMPLETA DO BANCO DE DADOS

```
public (schema)
├── user_profiles (perfis de usuários)
│   ├── id (PK, FK → auth.users)
│   ├── first_name, last_name, phone
│   └── created_at, updated_at
│
├── obras (projetos)
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── nome, nome_cliente, tipo
│   ├── area, localizacao (JSONB)
│   ├── orcamento, valor_contratado
│   ├── data_inicio, data_termino
│   └── criada_em, atualizada_em
│
├── despesas (lançamentos de despesa)
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── descricao, valor, categoria
│   ├── data, forma_pagamento
│   ├── profissional_id (FK → profissionais)
│   ├── observacao, comprovante_url ⬅️ NOVO
│   └── criada_em, atualizada_em
│
├── profissionais (cadastro de profissionais)
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── nome, funcao, telefone, email, cpf
│   ├── observacoes
│   ├── contrato (JSONB) ⬅️ ATUALIZADO
│   └── criado_em, atualizado_em
│
├── pagamentos (histórico de pagamentos)
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── profissional_id (FK → profissionais)
│   ├── valor, data, forma_pagamento
│   ├── observacao, comprovante_url ⬅️ NOVO
│   └── criado_em, atualizado_em
│
├── recebimentos (recebimentos do cliente)
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── valor, data, forma_pagamento
│   ├── observacao, comprovante_url ⬅️ NOVO
│   └── criado_em
│
├── alertas_orcamento ⬅️ NOVA TABELA
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── ativo, percentuais[], disparados[]
│   └── criado_em, atualizado_em
│
├── alertas_prazo ⬅️ NOVA TABELA
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── titulo, data, aviso_antecipado
│   ├── disparado
│   └── criado_em
│
├── alertas_pagamento ⬅️ NOVA TABELA
│   ├── id (PK)
│   ├── user_id (FK → auth.users)
│   ├── obra_id (FK → obras)
│   ├── titulo, categoria, valor
│   ├── profissional_id (FK → profissionais)
│   ├── data_inicial, recorrencia
│   ├── dia_semana, lembrete_antecipado
│   ├── proxima_data, disparado, anexo
│   └── criado_em
│
└── notificacoes ⬅️ NOVA TABELA
    ├── id (PK)
    ├── user_id (FK → auth.users)
    ├── obra_id (FK → obras)
    ├── tipo, titulo, mensagem
    ├── lida, alerta_id
    └── criada_em

storage (schema)
└── comprovantes (bucket) ⬅️ NOVO
    └── {user_id}/
        ├── despesas/
        │   └── {despesa_id}_{timestamp}.{ext}
        ├── pagamentos/
        │   └── {pagamento_id}_{timestamp}.{ext}
        └── recebimentos/
            └── {recebimento_id}_{timestamp}.{ext}
```

---

## 🔒 SEGURANÇA (Row Level Security)

### Todas as tabelas possuem RLS habilitado com as seguintes políticas:

- ✅ **SELECT** - Usuário vê apenas seus próprios dados
- ✅ **INSERT** - Usuário cria apenas com seu user_id
- ✅ **UPDATE** - Usuário atualiza apenas seus próprios dados
- ✅ **DELETE** - Usuário deleta apenas seus próprios dados

### Bucket de Storage:
- ✅ **Upload** - Apenas usuários autenticados, na pasta do próprio user_id
- ✅ **Read** - Público (URLs diretas)
- ✅ **Update/Delete** - Apenas o proprietário do arquivo

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### **Erro: "permission denied for table X"**
**Solução:** Verifique se as políticas de RLS foram criadas corretamente. Re-execute o script `SCHEMA_COMPLETO_SUPABASE.sql`.

### **Erro: "Could not find the 'X' column in the schema cache"**
**Solução:** A tabela não possui a coluna necessária. Re-execute o script completo.

### **Erro ao fazer upload de comprovante**
**Solução:**
1. Verifique se o bucket "comprovantes" existe
2. Confirme se é público (Public bucket: YES)
3. Execute o script `CONFIGURAR_STORAGE.sql`

### **Dados não aparecem no sistema**
**Solução:**
1. Verifique se está logado com o usuário correto
2. Confirme se o RLS está habilitado
3. Verifique no Table Editor do Supabase se os dados estão lá
4. Reinicie o servidor de desenvolvimento

---

## 📞 SUPORTE

Se encontrar problemas durante a instalação:

1. Verifique os logs no Console do navegador (F12)
2. Verifique os logs do servidor Next.js no terminal
3. Consulte a documentação do Supabase: https://supabase.com/docs

---

## ✅ CHECKLIST FINAL

- [ ] Executei o script `SCHEMA_COMPLETO_SUPABASE.sql`
- [ ] Criei o bucket "comprovantes" no Storage
- [ ] Executei o script `CONFIGURAR_STORAGE.sql`
- [ ] Verifiquei as variáveis de ambiente no `.env`
- [ ] Reiniciei o servidor de desenvolvimento
- [ ] Testei criar uma obra no sistema
- [ ] Testei adicionar uma despesa
- [ ] Testei cadastrar um profissional
- [ ] Verifiquei os dados no Supabase Table Editor
- [ ] Testei fazer upload de um comprovante

---

**🎉 Parabéns! Seu banco de dados está completamente configurado e pronto para uso!**
