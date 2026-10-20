# TantraSaga website preview

Open `index.html` in a modern browser. The site is a static, responsive front-end preview with a working consultation form and admin dashboard.

## Preview behavior

- Consultation requests are saved only in the current browser using local storage.
- The admin dashboard opens from the small **Admin** link at the bottom of the page. It can review requests and mark them as reviewed.
- Use the language selector in the top navigation to switch between English and Hindi. The selected language is remembered in that browser.
- No request is emailed or sent to a server. There is no authentication, shared database, payment flow, or production booking integration in this static preview.
- The supplied emblem is used in the hero and footer. The compact navigation wordmark remains typographic so it stays readable at small sizes.
- Cinzel and Inter are loaded from Google Fonts when internet access is available; system fallbacks are included.

For a live booking workflow, connect the form and dashboard to a secured server/API and add authenticated admin access.