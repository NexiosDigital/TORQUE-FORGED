# 🏁 Torque Forged Motorsport

<div align="center">

![Torque Forged Logo](https://img.shields.io/badge/TORQUE-FORGED-dc2626?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJ2NCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIi8+CjxwYXRoIGQ9Im0xNi4yIDcuOCAyLjktMi45IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KPHN2Zz4K)

**Blog especializado em motorsport, automobilismo e cultura automotiva**

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo](https://torque-forged.vercel.app) • [Documentação](#-documentação) • [Contribuir](#-contribuição)

</div>

## 📖 Sobre o Projeto

**Torque Forged Motorsport** é um blog moderno e responsivo dedicado ao mundo do automobilismo. Desenvolvido com React e Supabase, oferece uma experiência completa para entusiastas de corridas, tuning e cultura automotiva.

### 🎯 Objetivo

Criar uma plataforma moderna e interativa que cubra todos os aspectos do motorsport, desde Fórmula 1 até modificações de motores, com uma interface elegante e funcionalidades avançadas.

## ✨ Features

### 🔐 **Sistema de Autenticação**
- Login/logout seguro com Supabase Auth
- Perfis de usuário com upload de avatar
- Sistema de roles (Admin/Usuário)
- Proteção de rotas administrativas

### 📝 **Gerenciamento de Conteúdo**
- Editor visual de posts com React Quill
- Sistema de categorias dinâmico
- Tags e metadados para SEO
- Status de publicação (Rascunho/Publicado)
- Posts em destaque (trending)

### 🎨 **Interface Moderna**
- Design responsivo e mobile-first
- Tema dark com gradientes elegantes
- Animações suaves e micro-interações
- Glassmorphism effects
- Loading states e error handling

### 📱 **PWA Ready**
- Service Worker configurado
- Manifest.json otimizado
- Suporte offline básico
- Ícones otimizados para diferentes dispositivos

### 🗂️ **Categorias de Conteúdo**
- **Fórmula 1** - Elite do automobilismo mundial
- **NASCAR** - Categoria mais popular dos EUA
- **Endurance** - Corridas de resistência épicas
- **Formula Drift** - Arte de deslizar com estilo
- **Tuning & Custom** - Personalização e modificações
- **Motores** - Tecnologia e performance

## 🛠️ Tecnologias Utilizadas

### **Frontend**
- **React 18** - Framework frontend moderno
- **React Router Dom 7** - Roteamento SPA
- **Tailwind CSS 3** - Framework CSS utility-first
- **Framer Motion** - Animações e transições
- **Lucide React** - Ícones modernos e consistentes

### **Backend & Database**
- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança avançada
- **Supabase Storage** - Upload de arquivos

### **Formulários & Validação**
- **React Hook Form** - Gerenciamento de formulários
- **React Quill** - Editor de texto rico
- **React Hot Toast** - Notificações elegantes

### **Development & Build**
- **Create React App** - Base do projeto
- **PostCSS & Autoprefixer** - Processamento CSS
- **ESLint** - Linting de código

## 🚀 Instalação e Configuração

### **Pré-requisitos**
- Node.js 16+ 
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### **1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/torque-forged-motorsport.git
cd torque-forged-motorsport
```

### **2. Instale as dependências**
```bash
npm install
# ou
yarn install
```

### **3. Configure as variáveis de ambiente**
```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o .env com suas credenciais do Supabase
REACT_APP_SUPABASE_URL=sua_url_do_supabase
REACT_APP_SUPABASE_ANON_KEY=sua_chave_publica_do_supabase
```

### **4. Configure o Supabase**

#### **4.1. Criar projeto no Supabase**
1. Acesse [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Copie a URL e a chave pública para o `.env`

#### **4.2. Executar o schema do banco**
```sql
-- Execute no SQL Editor do Supabase
-- Arquivo: database/schema.sql (fornecido no projeto)
```

#### **4.3. Configurar Storage**
1. **Storage > Create Bucket**
   - Nome: `avatars`
   - Público: ✅
2. Execute as policies de storage (arquivo fornecido)

#### **4.4. Criar usuário administrador**
1. **Authentication > Users > Create User**
   - Email: `admin@torqueforged.com`
   - Password: `SuaSenhaSegura123`
   - Auto Confirm: ✅

### **5. Iniciar o projeto**
```bash
npm start
# ou
yarn start
```

Acesse: `http://localhost:3000`

## 📁 Estrutura do Projeto

```
torque-forged/
├── public/
│   ├── index.html              # HTML principal
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # Ícones PWA
├── src/
│   ├── components/             # Componentes reutilizáveis
│   │   ├── Layout/
│   │   │   ├── Header.js       # Navbar principal
│   │   │   ├── Footer.js       # Rodapé
│   │   │   └── Layout.js       # Layout wrapper
│   │   ├── CategoryPage.js     # Página de categoria
│   │   └── ProtectedRoute.js   # Proteção de rotas
│   ├── contexts/               # Contextos React
│   │   └── AuthContext.js      # Autenticação global
│   ├── hooks/                  # Custom hooks
│   │   └── usePosts.js         # Hook para posts
│   ├── lib/                    # Configurações
│   │   └── supabase.js         # Cliente Supabase
│   ├── pages/                  # Páginas da aplicação
│   │   ├── Home.js             # Homepage
│   │   ├── About.js            # Sobre
│   │   ├── Contact.js          # Contato
│   │   ├── Profile.js          # Perfil do usuário
│   │   ├── PostDetail.js       # Detalhes do post
│   │   ├── Category.js         # Lista por categoria
│   │   └── Admin/              # Páginas administrativas
│   │       ├── Login.js        # Login admin
│   │       ├── Dashboard.js    # Dashboard
│   │       └── PostEditor.js   # Editor de posts
│   ├── data/                   # Dados estáticos
│   │   └── posts.js            # Posts de exemplo
│   ├── App.js                  # Componente principal
│   ├── index.js                # Entrada da aplicação
│   └── index.css               # Estilos globais
├── database/                   # Scripts SQL
│   ├── schema.sql              # Schema principal
│   └── storage-setup.sql       # Configuração storage
├── .env.example                # Exemplo de variáveis
├── package.json                # Dependências
├── tailwind.config.js          # Configuração Tailwind
└── README.md                   # Documentação
```

## 🗄️ Schema do Banco de Dados

### **Tabelas Principais**

#### **user_profiles**
```sql
- id (UUID, PK, FK: auth.users)
- email (TEXT, NOT NULL)
- full_name (TEXT)
- avatar_url (TEXT)
- role (TEXT, DEFAULT: 'user')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### **categories**
```sql
- id (TEXT, PK)
- name (TEXT, NOT NULL)
- description (TEXT)
- color (TEXT) -- Classes Tailwind para gradientes
- created_at (TIMESTAMP)
```

#### **posts**
```sql
- id (UUID, PK)
- title (TEXT, NOT NULL)
- slug (TEXT, UNIQUE, NOT NULL)
- content (TEXT, NOT NULL)
- excerpt (TEXT, NOT NULL)
- image_url (TEXT)
- category (TEXT, FK: categories.id)
- category_name (TEXT)
- author (TEXT, DEFAULT: 'Equipe TF')
- read_time (TEXT, DEFAULT: '5 min')
- published (BOOLEAN, DEFAULT: false)
- trending (BOOLEAN, DEFAULT: false)
- tags (TEXT[])
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔐 Sistema de Autenticação

### **Roles e Permissões**

#### **👤 Usuário Comum**
- Visualizar posts públicos
- Gerenciar perfil próprio
- Alterar senha

#### **👑 Administrador**
- Todas as permissões de usuário
- Criar/editar/deletar posts
- Acessar dashboard administrativo
- Gerenciar categorias
- Ver estatísticas

### **Proteção de Rotas**
```javascript
// Rotas protegidas por autenticação
/profile          // Qualquer usuário logado
/admin/*          // Apenas administradores
```

## 🎨 Design System

### **Cores Principais**
```css
/* Vermelho Principal */
--red-primary: #dc2626;
--red-secondary: #ef4444;

/* Gradientes */
--gradient-primary: linear-gradient(to right, #dc2626, #ef4444);
--gradient-secondary: linear-gradient(135deg, #000000, #1f2937);

/* Texto */
--text-primary: #ffffff;
--text-secondary: #d1d5db;
--text-muted: #9ca3af;
```

### **Tipografia**
- **Fonte Principal**: Inter (Google Fonts)
- **Títulos**: Font Weight 900 (Black)
- **Corpo**: Font Weight 400-500
- **UI Elements**: Font Weight 600 (Semibold)

### **Componentes**
- **Bordas**: Rounded-xl (12px) / Rounded-2xl (16px)
- **Sombras**: shadow-lg com hover effects
- **Transições**: 300ms ease
- **Backdrop**: blur-md para glassmorphism

## 🚀 Deploy

### **Vercel (Recomendado)**
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variáveis de ambiente no dashboard
```

### **Netlify**
```bash
# Build
npm run build

# Deploy pasta build/ no Netlify
# Configurar variáveis de ambiente no painel
```

### **Variáveis de Produção**
```bash
REACT_APP_SUPABASE_URL=sua_url_producao
REACT_APP_SUPABASE_ANON_KEY=sua_chave_producao
```

## 🧪 Testes

### **Executar testes**
```bash
npm test
```

### **Build de produção**
```bash
npm run build
```

### **Análise do bundle**
```bash
npm run build
npx serve -s build
```

## 📊 Funcionalidades por Página

### **🏠 Homepage (`/`)**
- Hero section com call-to-actions
- Posts em destaque (trending)
- Últimos artigos publicados
- Sidebar com categorias e newsletter
- Loading states e error handling

### **📰 Páginas de Categoria (`/f1`, `/nascar`, etc.)**
- Posts filtrados por categoria
- Contagem de posts
- Design específico por categoria
- Paginação (futuro)

### **📖 Detalhes do Post (`/post/:id`)**
- Conteúdo completo do post
- Metadados (autor, data, tempo de leitura)
- Tags do post
- Posts relacionados da mesma categoria
- Botão de compartilhamento

### **👤 Perfil (`/profile`)**
- Edição de dados pessoais
- Upload de avatar
- Alteração de senha
- Informações da conta

### **🛡️ Dashboard Admin (`/admin/dashboard`)**
- Estatísticas de posts
- Gerenciamento de posts
- Criação/edição de conteúdo
- Controle de publicação

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
npm start                    # Inicia dev server
npm run build               # Build produção
npm test                    # Executa testes
npm run eject              # Ejeta CRA (cuidado!)

# Linting e formatação
npm run lint               # Verifica código
npm run lint:fix           # Corrige automaticamente

# Banco de dados
npm run db:reset           # Reset database (se configurado)
npm run db:seed            # Seed com dados exemplo

# Deploy
npm run deploy:vercel      # Deploy Vercel
npm run deploy:netlify     # Deploy Netlify
```

## 🤝 Contribuição

### **Como Contribuir**

1. **Fork** o projeto
2. **Clone** seu fork
```bash
git clone https://github.com/seu-usuario/torque-forged-motorsport.git
```
3. **Crie** uma branch para sua feature
```bash
git checkout -b feature/nova-funcionalidade
```
4. **Faça** suas alterações
5. **Commit** suas mudanças
```bash
git commit -m 'feat: adiciona nova funcionalidade'
```
6. **Push** para a branch
```bash
git push origin feature/nova-funcionalidade
```
7. **Abra** um Pull Request

### **Padrões de Commit**
```bash
feat: nova funcionalidade
fix: correção de bug
docs: atualização documentação
style: formatação, não afeta lógica
refactor: refatoração de código
test: adição/correção de testes
chore: tarefas de build, etc
```

### **Guidelines**
- Siga os padrões ESLint configurados
- Teste suas alterações localmente
- Documente novas funcionalidades
- Mantenha commits pequenos e descritivos

## 📝 Roadmap

### **🔄 Próximas Versões**

#### **v2.0 - Recursos Avançados**
- [ ] Sistema de comentários
- [ ] Busca avançada com Algolia
- [ ] Newsletter integrada
- [ ] Analytics e métricas
- [ ] Modo offline completo

#### **v2.1 - Melhorias UX**
- [ ] Tema claro/escuro
- [ ] Customização de layout
- [ ] Favoritos e bookmarks
- [ ] Compartilhamento social

#### **v2.2 - Performance**
- [ ] Lazy loading de imagens
- [ ] Pré-carregamento de rotas
- [ ] Cache avançado
- [ ] Otimização SEO

## 🐛 Problemas Conhecidos

- Upload de imagens grandes pode ser lento
- Service Worker ainda em desenvolvimento
- Busca limitada a título e conteúdo

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- **React Team** - Framework incrível
- **Supabase** - Backend simplificado
- **Tailwind CSS** - Styling eficiente
- **Vercel** - Deploy fácil e rápido
- **Unsplash** - Imagens de qualidade

## 📞 Contato

- **Website**: [torqueforged.com](https://torqueforged.com)
- **Email**: contato@torqueforged.com
- **Instagram**: [@torqueforged](https://instagram.com/torqueforged)
- **YouTube**: [Torque Forged](https://youtube.com/@torqueforged)

---

<div align="center">

**Desenvolvido com ❤️ por [Daniel Petronilha](https://github.com/Petronilha)**

[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Petronilha)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/danielpetronilha)

</div>