# apps/telegram-bot/src/i18n/locales/es.ftl

start-welcome =
    👋 ¡Bienvenido al <b>Solana Glossary Bot</b>!
    Busca cualquiera de los 1.001 términos de Solana.

    Prueba: <code>/glosario proof-of-history</code>
    O escribe <code>@{ $bot_username } poh</code> en cualquier chat.

help-message =
    📖 <b>Solana Glossary Bot</b>

    🔍 <b>Buscar:</b>
    /glosario &lt;término&gt; — buscar un término Solana
    /aleatorio — término aleatorio

    📂 <b>Explorar:</b>
    /categorias — ver las 14 categorías
    /categoria &lt;nombre&gt; — términos de una categoría

    📅 <b>Aprender:</b>
    /terminodelhoy — término del día
    /quiz — iniciar quiz
    /favoritos — mis términos guardados
    /historial — términos vistos recientemente
    /streak — ver tu racha
    /leaderboard — ranking global

    🌐 <b>Idioma:</b>
    /idioma pt|en|es — cambiar idioma

    💡 Escribe <code>@{ $bot_username } &lt;término&gt;</code> en cualquier chat!

term-aliases = 🔗 Alias
term-related = 📂 Relacionados

btn-related = 🔍 Términos relacionados
btn-category = 📂 Ver categoría
btn-share = 📤 Compartir

# Pagination
btn-prev = ← Anterior
btn-next = Siguiente →
btn-page = Pág { $current }/{ $total }

# Random term
random-term-header = 🎲 Término aleatorio

# Quiz
quiz-question =
    🧠 <b>¿Qué término describe esto?</b>

    <i>{ $definition }</i>
quiz-option-a = A) { $term }
quiz-option-b = B) { $term }
quiz-option-c = C) { $term }
quiz-option-d = D) { $term }
quiz-correct = ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.
quiz-correct-with-streak =
    ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.

    🔥 Racha: <b>{ $current }</b> días
quiz-correct-new-record =
    ✅ <b>¡Correcto!</b> Era <b>{ $term }</b>.

    🎉 <b>¡Nuevo récord!</b> ¡{ $max } días!

    🔥 Racha: <b>{ $max }</b> días
quiz-wrong = ❌ <b>Incorrecto.</b> La respuesta era <b>{ $term }</b>.
quiz-wrong-retry =
    ❌ <b>¡Casi!</b>

    ¿Qué quieres hacer?
quiz-btn-retry = 🔄 Intentar de Nuevo
quiz-btn-result = 📖 Ver Respuesta
quiz-try-again = 🔄 ¡Intentémoslo de nuevo!
quiz-result = 📖 La respuesta correcta es <b>{ $term }</b>.
quiz-no-session = ❌ No hay quiz activo. Usa /quiz para comenzar.
quiz-no-user = ❌ Usuario requerido para quiz.

# Favorites
btn-fav-add = ⭐ Guardar
btn-fav-remove = ★ Quitar
favorite-added = ⭐ ¡Guardado!
favorite-removed = Quitado.
favorites-header = ⭐ <b>Tus favoritos</b> — { $count } términos
favorites-empty = Aún no tienes términos guardados. Toca ⭐ en cualquier término.
favorites-limit = ⚠️ Límite de 50 favoritos alcanzado.

# History
history-header = 🕐 <b>Vistos recientemente</b>
history-empty = Aún no has consultado ningún término.

# Streaks
streak-day = 🔥 { $count } día seguido
streak-days = 🔥 { $count } días seguidos
streak-first = 🔥 ¡Primer día!
streak-message =
    { $fire } <b>Tu Racha</b>

    🔥 Actual: <b>{ $current }</b> días
    🏆 Récord: <b>{ $max }</b> días
    ❄️ Congelamientos: <b>{ $freezes }</b>/1 restante

    📅 Últimos 7 días:
    { $calendar }
streak-no-user = ❌ Se requiere usuario para ver racha.

# Notifications
notification-streak-warning = 🔥 ¡Alerta de Racha! Tienes 2 horas para hacer el /quiz y mantener tus { $streak } días.

# Quiz streak messages
quiz-new-record = 🎉 <b>¡Nuevo récord!</b> ¡{ $max } días!
quiz-streak-continued = 🔥 Racha: <b>{ $current }</b> días

# Leaderboard
leaderboard-title = 🏆 <b>Ranking Global — Top 10</b>
leaderboard-empty = 🏆 Aún no hay participantes. ¡Sé el primero en completar quizzes!
rank-no-user = ❌ Se requiere usuario para ver posición.
rank-no-streak = Aún no tienes una racha. ¡Haz un /quiz para empezar!
rank-position = 📊 <b>Tu posición:</b> #{ $rank } de { $total } participantes
rank-max-streak = 🔥 Tu mejor: { $max } días
rank-you = → <b>Tú</b>
leaderboard-entry = { $medal } { $name } — { $streak } días
rank-entry-simple = { $rank } — { $streak } días
rank-nearby = 📈 Competidores cercanos:

# Did you mean
did-you-mean =
    ❌ Sin resultados para ese término.

    ¿Quisiste decir: <code>{ $term }</code>?
btn-did-you-mean = Sí, mostrar →

# External links
term-read-more-label = Ver documentación Solana

# Onboarding
onboarding-tips =
    💡 <b>Consejos rápidos:</b>

    🔍 Busca cualquier término: <code>/glosario proof-of-history</code>
    📂 Explora por categoría: /categorias
    🧠 Pon a prueba tus conocimientos: /quiz

# Feedback
btn-feedback-up = 👍
btn-feedback-down = 👎
feedback-thanks = ¡Gracias por tu opinión!

term-not-found = ❌ Sin resultados para <b>{ $query }</b>. Usa /categorias para explorar.
multiple-results = 🔍 <b>{ $count }</b> resultados para <b>{ $query }</b>. Elige uno:
usage-glossary =
    💡 Uso: <code>/glosario &lt;término&gt;</code>
    Ejemplo: <code>/glosario proof-of-history</code>

categories-choose = 📚 <b>Solana Glossary — 14 Categorías</b>
    Elige una categoría:
categories-header =
    📚 <b>Solana Glossary — 14 Categorías</b>
    Usa <code>/categoria &lt;nombre&gt;</code> para listar los términos.
category-not-found = ❌ Categoría <b>{ $name }</b> no encontrada. Usa /categorias para ver las disponibles.
usage-category =
    💡 Uso: <code>/categoria &lt;nombre&gt;</code>
    Ejemplo: <code>/categoria defi</code>
category-header = 📂 <b>{ $name }</b> — { $count } términos

daily-term-header = Término del día

language-changed = ✅ Idioma cambiado a español.
language-invalid = ❌ Idioma inválido. Usa: <code>/idioma pt | en | es</code>

internal-error = ⚠️ Algo salió mal. Por favor, inténtalo de nuevo.
rate-limit = ⏳ ¡Ve más despacio! Espera un momento antes de enviar más mensajes.
