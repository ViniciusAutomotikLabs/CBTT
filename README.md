# Sistema de Controle de Demandas - CBTT

Um sistema leve e ágil ("Frontend-Only") desenvolvido para a **Confederação Brasileira de Tiro Tático (CBTT)**.
O objetivo deste painel é coletar e integrar as demandas e queixas dos CACs (Caçadores, Atiradores e Colecionadores) de todo o Brasil, gerando gráficos de métricas inteligentes para auxiliar a diretoria e presidência em tomadas de decisões e diligências judiciais.

## 🚀 Tecnologias Integradas

- **Frontend Core:** HTML5, Vanilla JavaScript, CSS3
- **Identidade Visual:** Dark Mode com UI Premium Glassmorphism (tons de cinza metálico, verde-oliva e amarelo-ouro - aderente à CBTT).
- **Backend as a Service (BaaS):** Supabase (Armazenamento em Banco Relacional e Hospedagem de Arquivos em Nuvem).
- **Dashboard:** Gráficos interativos integrados com a biblioteca nativa **Chart.js**.

## 🛠 Arquitetura do Projeto

* `index.html`: Página de aterrissagem pública com o formulário de petição do atirador, integrado com upload de arquivos (prints e PDFs).
* `admin.html`: Painel reservado para a gerência da CBTT onde os gráficos analíticos e a tabela de respostas ficam contidos.
* `login.html`: Tela de recepção para a Diretoria, acionando a API de Sessão Segura.
* `/css/style.css`: Motor base de todo o visual.
* `/js/app.js`: Script responsável por submeter os formulários e arquivos da Landing Page.
* `/js/admin.js`: Script que checa a autenticação (se é válida) para desenhar a UI do Painel Gerencial.
* `/js/login.js`: Rotina visual pro login dos executivos.
* `/js/config.example.js`: Template estrutural do Supabase com as chaves privadas de envio. *(Obs: Renomear para config.js localmente antes de preencher ativamente)*.

## 🎲 Como Executar / Fazer Deploy

Como esta aplicação é puramente estática:
1. **Localmente:** Basta abrir o arquivo `index.html` em seu navegador para validar as estéticas e os scripts.
2. **Deploy na Vercel:** Basta conectar este repositório do GitHub em um novo projeto estático na Vercel. Não há necessidade de construir "Builds" (Nenhum `npm run build` ou `npm run dev` é necessário).

## 🗄 Diretrizes de Configuração no Supabase

> É de vital importância que esta estrutura seja fiel no seu repositório Supabase.

1. **Criação da Tabela**
   - Nome: `demandas_cbtt`
   - Campos: 
     - `id` (uuid)
     - `nome` (text)
     - `cr` (text)
     - `estado` (text)
     - `tipo_problema` (text)
     - `descricao` (text)
     - `anexo_url` (text)
     - `created_at` (timestampz)

2. **Criação do Storage**
   - Nome do Bucket: `anexos_demandas` (Atenção: Marque o bucket como **Public**)

3. **Sistema de Autenticação e Segurança (RLS)**
   - Ao ativar o Row-Level Security no seu SQL Editor, dispare:
   
   ```sql
    -- Permite inserção aberta no formulário público
    CREATE POLICY "Permitir Qualquer Pessoa Inserir"
    ON public.demandas_cbtt FOR INSERT
    TO public
    WITH CHECK (true);

    -- Permite visualização apenas por Diretores (Usuários com login)
    CREATE POLICY "Permitir Apenas Diretoria Ler"
    ON public.demandas_cbtt FOR SELECT
    TO authenticated
    USING (true);

    -- Storage (Se exigido Policy para Uploads Anônimos) --
    CREATE POLICY "Permitir upload publico em anexo" 
    ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'anexos_demandas');
    ```

### Criação de Conta
Como o sistema não possui registro aberto, o Presidente ou Executivo de T.I deverá acessar o painel do Supabase, clicar no menu **"Authentication" > "Add User"** e preencher manualmente o e-mail e a senha inicial do membro da diretoria que atuará no comitê.
