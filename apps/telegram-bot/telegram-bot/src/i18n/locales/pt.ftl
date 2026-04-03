# apps/telegram-bot/src/i18n/locales/pt.ftl

start-welcome =
    👋 Bem-vindo ao <b>Solana Glossary Bot</b>!
    Pesquise qualquer um dos 1.001 termos Solana.

    Tente: <code>/glossario proof-of-history</code>
    Ou digite <code>@{ $bot_username } poh</code> em qualquer chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glossario &lt;termo&gt; — buscar em português
    /glossary &lt;term&gt; — search in English
    /glosario &lt;term&gt; — buscar en español

    📂 <b>Explorar:</b>
    /categorias — listar as 14 categorias
    /categoria &lt;nome&gt; — termos de uma categoria

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — trocar idioma

    💡 <b>Inline mode:</b> digite <code>@{ $bot_username } &lt;termo&gt;</code> em qualquer chat

term-aliases = 🔗 Aliases
term-related = 📂 Relacionados

btn-related = 🔍 Relacionados
btn-category = 📂 Ver categoria

term-not-found = ❌ Nenhum resultado para <b>{ $query }</b>. Use /categorias para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Escolha um:
usage-glossary =
    💡 Uso: <code>/glossario &lt;termo&gt;</code>
    Exemplo: <code>/glossario proof-of-history</code>

categories-header =
    📚 <b>Solana Glossary — 14 Categorias</b>
    Use <code>/categoria &lt;nome&gt;</code> para listar os termos.
category-not-found = ❌ Categoria <b>{ $name }</b> não encontrada. Use /categorias para ver as disponíveis.
usage-category =
    💡 Uso: <code>/categoria &lt;nome&gt;</code>
    Exemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } termos

language-changed = ✅ Idioma alterado para português.
language-invalid = ❌ Idioma inválido. Use: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo deu errado. Tente novamente.
rate-limit = ⏳ Devagar! Aguarde um momento antes de enviar mais mensagens.
