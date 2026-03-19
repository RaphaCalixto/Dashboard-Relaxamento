# Relaxamento dashboard

# Projeto:

**[https://vercel.com/raphacalixto10-4341s-projects/v0-relaxamento-dashboard](https://vercel.com/raphacalixto10-4341s-projects/v0-relaxamento-dashboard)**

# Dashboard

Este é um projeto de dashboard de relaxamento desenvolvido com Next.js.

## Requisitos

- Node.js (versão 14 ou superior)
- pnpm (gerenciador de pacotes)

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/relaxation-dashboard.git
   cd relaxation-dashboard
   ```

2. Instale as dependências:
   ```bash
   pnpm install
   ```

## Executando o Projeto

Para iniciar o servidor de desenvolvimento, execute:
```bash
pnpm dev
```

O projeto estará disponível em [http://localhost:3000](http://localhost:3000).

## Observações

- Certifique-se de que o pnpm está instalado e configurado corretamente no seu sistema.
- Se encontrar problemas com o pnpm, verifique se o caminho do pnpm está adicionado ao PATH do sistema.


## 📷 Imagem de Demonstração
 ![Dashboard](https://i.imgur.com/ZKqJyT2.jpeg)

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature 
3. Faça o Commit das suas mudanças 
4. Faça o Push para a Branch 
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

Raphael Calixto
- GitHub: [@RaphaCalixto](https://github.com/RaphaCalixto)
- Email: raphacalixto10@gmail.com 

## Migracao do Banco (Supabase)

Para usar categorias nas tarefas, execute no SQL Editor do Supabase:

- `supabase/migrations/20260317_add_user_tasks_category.sql`
- `supabase/migrations/20260317_create_user_whiteboards.sql`

## Integracao IA (Mermaid)

Para gerar diagramas com IA no quadro, crie o arquivo `.env.local` na raiz:

```bash
OPENAI_API_KEY=sua_chave_aqui
OPENAI_MODEL=gpt-4.1-mini
```

- `OPENAI_MODEL` e opcional.
- A rota usada pelo app e `POST /api/diagram-mermaid`.
