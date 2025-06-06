# 🏁 Torque Forged Motorsport

> Blog especializado em motorsport, automobilismo e cultura automotiva

## 🚀 Tecnologias Utilizadas

- **React 18** - Frontend framework
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Supabase** - Backend e autenticação
- **React Hook Form** - Gerenciamento de formulários
- **React Quill** - Editor visual
- **Lucide React** - Ícones
- **React Hot Toast** - Notificações

## 📦 Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/torque-forged-motorsport.git

# Entrar na pasta
cd torque-forged-motorsport

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais do Supabase

# Executar em desenvolvimento
npm start
```

## 🗄️ Configuração do Banco de Dados

1. Criar projeto no [Supabase](https://supabase.com)
2. Executar o schema SQL fornecido
3. Configurar autenticação email/password
4. Adicionar as credenciais no arquivo `.env`

## 🛣️ Rotas

### Públicas
- `/` - Homepage
- `/f1` - Fórmula 1
- `/nascar` - NASCAR
- `/endurance` - Endurance
- `/drift` - Formula Drift
- `/tuning` - Tuning & Custom
- `/engines` - Motores
- `/about` - Sobre
- `/contact` - Contato

### Administrativas
- `/admin/login` - Login
- `/admin/dashboard` - Dashboard
- `/admin/posts/new` - Criar post
- `/admin/posts/edit/:id` - Editar post

## 🔐 Sistema Admin

O sistema inclui:
- Autenticação segura
- Dashboard com estatísticas
- Editor visual de posts
- Gerenciamento de categorias
- Sistema de tags
- Upload de imagens
- Status de publicação

## 📱 PWA

O projeto está configurado como PWA (Progressive Web App) com:
- Service Worker
- Manifest.json
- Ícones otimizados
- Offline support

## 🎨 Design

- Design responsivo e moderno
- Tema dark com gradientes
- Animações suaves
- Glassmorphism effects
- Otimizado para performance

## 🚢 Deploy

```bash
# Build para produção
npm run build

# Deploy no Vercel/Netlify
# Configure as variáveis de ambiente na plataforma
```

## 📄 Licença

MIT License - veja [LICENSE.md](LICENSE.md) para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

Desenvolvido com ❤️ por [Daniel Petronilha](https://github.com/Petronilha)

