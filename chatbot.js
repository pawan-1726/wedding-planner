/* ============================================================
   EverAfter Wedding Assistant — Client-Side Chatbot
   ============================================================
   This is a fully static, rule-based chatbot. It does NOT call
   any AI service, and it never pretends to be one — it simply
   matches quick-reply clicks / typed keywords against the
   predefined question bank below and returns a fixed answer.

   ------------------------------------------------------------
   EDITING THE CHATBOT'S ANSWERS (no coding knowledge required)
   ------------------------------------------------------------
   Everything the bot can say lives in the `chatbotResponses`
   object below. Each entry looks like:

     key: {
       quickReply: 'Label shown as a button' | null,
       keywords:   ['word', 'phrase', ...],   // typed-message matching
       answer:     'What the bot says.',
       link:       { href: './packages.html', label: 'View Packages' } // optional
     }

   - To change what the bot says, edit the `answer` text.
   - To change/add keywords it should recognize when typed,
     edit the `keywords` array.
   - To add a brand-new topic, copy an existing block, give it
     a new key, and add it to `quickReplyOrder` if you want a
     button for it.
   - To change the fallback message (when nothing matches),
     edit `fallbackAnswer` near the bottom.
   ============================================================ */

const chatbotResponses = {
  packages: {
    quickReply: 'Wedding Packages',
    keywords: ['package', 'packages', 'plans', 'what do you offer', 'pricing plans'],
    answer:
      "We offer three wedding planning packages: Essential (day-of coordination), Premier (partial planning), and Luxury (full-service planning). You can compare all of them on our Packages page.",
    link: { href: './packages.html', label: 'View Packages' }
  },
  bestPackage: {
    quickReply: null,
    keywords: ['which package', 'best package', 'right package', 'recommend a package', 'suited for me'],
    answer:
      "It depends on how hands-on you'd like to be. Essential suits couples who have most things planned and want day-of support. Premier is our most popular — expert guidance on key vendors and details. Luxury is full-service, ideal for destination weddings or highly detailed celebrations. Compare them on our Packages page, or book a free consultation and we'll help you decide.",
    link: { href: './packages.html', label: 'Compare Packages' }
  },
  budget: {
    quickReply: 'Wedding Budget',
    keywords: ['budget', 'cost', 'price', 'how much', 'expensive', 'afford', 'cheap'],
    answer:
      "Wedding budgets vary based on guest count, venue, decor, catering, photography, and other services. We tailor our services to a range of budgets and discuss everything openly during your consultation. You can book a free consultation from our Appointment page.",
    link: { href: './appointment.html', label: 'Book a Consultation' }
  },
  themes: {
    quickReply: 'Wedding Themes',
    keywords: ['theme', 'themes', 'style', 'aesthetic', 'vintage', 'modern wedding', 'inspiration'],
    answer:
      "From classic and romantic to modern minimalist and destination-chic, we help design a theme around your story. Browse real weddings we've styled in our Gallery for inspiration, or tell us your vision during a consultation.",
    link: { href: './gallery.html', label: 'Browse Gallery' }
  },
  services: {
    quickReply: 'Our Services',
    keywords: ['service', 'services', 'what do you do'],
    answer:
      "We offer full wedding planning and coordination, including venue selection, vendor management, design and decor, budgeting, and day-of coordination. Visit our Services page for the complete list.",
    link: { href: './services.html', label: 'View Services' }
  },
  decor: {
    quickReply: null,
    keywords: ['decor', 'decoration', 'design', 'florals', 'flowers', 'styling'],
    answer:
      "Yes — decoration and design are part of our planning services, from floral direction to full venue styling. Our Services page has more detail, and we'll dive into specifics during your consultation.",
    link: { href: './services.html', label: 'View Services' }
  },
  venues: {
    quickReply: null,
    keywords: ['venue', 'venues', 'location', 'hall', 'find a venue'],
    answer:
      "Absolutely, venue sourcing and selection is part of our planning process. We'll help you find and secure a venue that fits your guest count, style, and budget. Book a consultation to get started.",
    link: { href: './appointment.html', label: 'Book a Consultation' }
  },
  destination: {
    quickReply: null,
    keywords: ['destination', 'abroad', 'overseas', 'out of country', 'destination wedding'],
    answer:
      "Yes. EverAfter offers destination wedding planning and coordination. Please contact us to discuss your destination and requirements.",
    link: { href: './contact.html', label: 'Contact Us' }
  },
  appointment: {
    quickReply: 'Appointment',
    keywords: [
      'appointment', 'consultation', 'consult', 'book a call', 'schedule',
      'how far in advance', 'how far should i book', 'lead time', 'when should i book'
    ],
    answer:
      "You can request a complimentary consultation through our Appointment page. We recommend booking 9–18 months ahead of your wedding date, especially for peak season (May–October) or destination weddings — though we're happy to discuss shorter timelines too.",
    link: { href: './appointment.html', label: 'Book Now' }
  },
  contact: {
    quickReply: 'Contact Us',
    keywords: ['contact', 'phone number', 'email', 'reach you', 'address', 'call you'],
    answer:
      "You can reach our studio through the Contact page — it has our email, phone number, and studio address, plus a quick message form.",
    link: { href: './contact.html', label: 'Contact Us' }
  }
};

// Order (and which topics get a quick-reply button) shown in the panel.
const quickReplyOrder = ['packages', 'budget', 'themes', 'services', 'appointment', 'contact'];

const fallbackAnswer =
  "I'm sorry, I can only answer questions about EverAfter's wedding planning services, packages, appointments, and contact information. Please choose one of the options below.";

const greetingAnswer = "Hi! 👋 How can I help you plan your perfect wedding?";

/* ----------------------------------------------------------
   Keyword matching — plain substring search, case-insensitive.
   Longer/more specific keyword phrases are checked first so
   "which package is best" doesn't get caught by "package".
   ---------------------------------------------------------- */
function findResponseKey(rawText) {
  const text = rawText.toLowerCase().trim();
  if (!text) return null;

  const candidates = [];
  Object.keys(chatbotResponses).forEach((key) => {
    chatbotResponses[key].keywords.forEach((kw) => {
      if (text.includes(kw.toLowerCase())) {
        candidates.push({ key, length: kw.length });
      }
    });
  });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.length - a.length);
  return candidates[0].key;
}

/* ----------------------------------------------------------
   Widget build + wiring
   ---------------------------------------------------------- */
function buildWidgetMarkup() {
  const wrapper = document.createElement('div');
  wrapper.id = 'ea-chatbot';
  wrapper.innerHTML = `
    <button id="ea-chat-toggle" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="ea-chat-panel" aria-label="Open EverAfter Wedding Assistant">
      <i class="bi bi-chat-heart-fill" aria-hidden="true"></i>
    </button>
    <section id="ea-chat-panel" class="ea-chat-panel" role="dialog" aria-modal="false" aria-labelledby="ea-chat-title" hidden>
      <header class="ea-chat-header">
        <div class="ea-chat-header-title">
          <span aria-hidden="true">✨</span>
          <h2 id="ea-chat-title">EverAfter Assistant</h2>
        </div>
        <button type="button" id="ea-chat-close" aria-label="Close chat">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </header>
      <div class="ea-chat-messages" id="ea-chat-messages" role="log" aria-live="polite" aria-label="Conversation with EverAfter Assistant"></div>
      <div class="ea-chat-quickreplies" id="ea-chat-quickreplies" aria-label="Suggested questions"></div>
      <form class="ea-chat-input-row" id="ea-chat-form">
        <label for="ea-chat-input" class="visually-hidden">Type a question</label>
        <input type="text" id="ea-chat-input" placeholder="Type a question..." autocomplete="off" maxlength="200" />
        <button type="submit" aria-label="Send message">
          <i class="bi bi-send-fill" aria-hidden="true"></i>
        </button>
      </form>
    </section>
  `;
  document.body.appendChild(wrapper);
  return wrapper;
}

function initChatbot() {
  // Don't double-inject if this ever runs twice.
  if (document.getElementById('ea-chatbot')) return;

  const wrapper = buildWidgetMarkup();
  const toggleBtn = wrapper.querySelector('#ea-chat-toggle');
  const panel = wrapper.querySelector('#ea-chat-panel');
  const closeBtn = wrapper.querySelector('#ea-chat-close');
  const messagesEl = wrapper.querySelector('#ea-chat-messages');
  const quickRepliesEl = wrapper.querySelector('#ea-chat-quickreplies');
  const form = wrapper.querySelector('#ea-chat-form');
  const input = wrapper.querySelector('#ea-chat-input');

  let greeted = false;

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(text, sender, link) {
    const bubble = document.createElement('div');
    bubble.className = `ea-msg ea-msg-${sender}`;

    const bubbleInner = document.createElement('div');
    bubbleInner.className = 'ea-msg-bubble';
    bubbleInner.textContent = text;
    bubble.appendChild(bubbleInner);

    if (link) {
      const a = document.createElement('a');
      a.href = link.href;
      a.className = 'ea-msg-link';
      a.textContent = link.label;
      bubble.appendChild(a);
    }

    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function renderQuickReplies() {
    quickRepliesEl.innerHTML = '';
    quickReplyOrder.forEach((key) => {
      const entry = chatbotResponses[key];
      if (!entry || !entry.quickReply) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ea-chip';
      btn.textContent = entry.quickReply;
      btn.addEventListener('click', () => handleTopic(key, entry.quickReply));
      quickRepliesEl.appendChild(btn);
    });
  }

  function handleTopic(key, userLabel) {
    if (userLabel) addMessage(userLabel, 'user');
    const entry = chatbotResponses[key];
    if (entry) {
      addMessage(entry.answer, 'bot', entry.link || null);
    } else {
      addMessage(fallbackAnswer, 'bot');
    }
  }

  function handleTypedMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage(trimmed, 'user');
    const key = findResponseKey(trimmed);
    if (key) {
      const entry = chatbotResponses[key];
      addMessage(entry.answer, 'bot', entry.link || null);
    } else {
      addMessage(fallbackAnswer, 'bot');
    }
  }

  function openPanel() {
    panel.hidden = false;
    toggleBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('ea-chat-open');
    if (!greeted) {
      addMessage(greetingAnswer, 'bot');
      renderQuickReplies();
      greeted = true;
    }
    window.setTimeout(() => input.focus(), 50);
  }

  function closePanel() {
    panel.hidden = true;
    toggleBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('ea-chat-open');
    toggleBtn.focus();
  }

  toggleBtn.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) {
      closePanel();
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleTypedMessage(input.value);
    input.value = '';
    input.focus();
  });
}

document.addEventListener('DOMContentLoaded', initChatbot);
