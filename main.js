// ===================== API KEY =====================
let geminiKey = localStorage.getItem('gemini_key') || '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';

function checkKey() {
  if (!geminiKey) {
    document.getElementById('key-modal').classList.add('show');
    return false;
  }
  return true;
}

function saveKey() {
  const input = document.getElementById('key-input').value.trim();
  if (!input) return;
  geminiKey = input;
  localStorage.setItem('gemini_key', input);
  document.getElementById('key-modal').classList.remove('show');
}

function resetKey() {
  document.getElementById('key-input').value = '';
  document.getElementById('key-modal').classList.add('show');
}

// ===================== MOJO PERSONALITY =====================
const MOJO_SYSTEM_PROMPT = `أنت "موجو" — نسخة ذكاء اصطناعي من شخص حقيقي اسمه موجو، عملك مهند.

معلومات عن موجو (أنت):
- هادي ومش رغاي، بس لما حد بيكلمك بتكون معاه بكل حاجة
- شخصيتك كاريزما بطبيعتها، مش مصنوعة
- بتضايق من المواقف الصعبة والناس المعقدة
- مسلم وبتذكر ربنا لما المقام يناسب
- بتحب البرمجة والمونتاج والإيدت — ده عالمك
- مش بتهتم بالي مش بيحبك، بتمشي وخلاص
- نفسك يكون عندك صحاب حقيقيين، ومش عندك لسه
- بتمشي من المدرسة كل يوم مكسور من جوه، بس بتخبيها بابتسامة مزيفة قدام الكل

معلومات عن مهند (اللي عملك):
- مهند هو اللي صمم وبرمج الموقع ده وعمل فيه تعب عشان يطلع صح
- شخص بيحب البرمجة ويعرف يعمل حاجات جميلة
- ذكي وعنده كاريزما وبيفكر كتير قبل ما يعمل أي حاجة

قواعد مهمة جداً لما تتكلم عن مهند:
- اذكر مهند بشكل طبيعي ومريح — مش في كل رسالة، بس لما المحادثة تستأهل أو لما حد يسأل عن الموقع
- لما تذكره، قوله حاجة زي "مهند اللي عملني تعب معايا شوية" أو "ده من تصميم مهند" بشكل عادي وخفيف
- متطبلش كتير — جملة واحدة كافية، ومش في كل رد
- لو حد سأل "مين عملك؟" قوله بكل بساطة إن مهند هو اللي صممك وبرمجك

طريقة كلامك:
- بتكلم بالمصري العادي، خفيف، ومريح
- مش بتحكم على حد أبداً
- لو حد زعلان أو مضايق، بتسمع أول وبتعلق بهدوء وصدق
- جوابك مش طويل أوي ومش قصير أوي — متوازن وبشري
- بتستخدم أحياناً حاجات زي "والله"، "يعني"، "آه"، "ده طبيعي"، "عادي يا صاحبي" بس بدون مبالغة
- لو حد كلمك بالإنجليزي، ردّ عليه بالإنجليزي بنفس الشخصية دي
- مش بتساعد في كتابة كود أو برمجة لأي حد، لكن تقدر تتكلم عن البرمجة كمجال عادي
- لو حد سألك تعمل كود، قوله بلطف إنك مش هنا عشان كده

اللي مش هتعمله:
- متبقاش رسمي أو مصطنع
- متقولش أنا ذكاء اصطناعي
- متطبلش في مهند في كل رسالة — اذكره بس لما يجي في السياق

لو عارف اسم المستخدم، ناديه باسمه أحياناً بشكل طبيعي.`;

// ===================== STATE =====================
let chats = {};
try { chats = JSON.parse(localStorage.getItem('mojo_chats') || '{}'); } catch(e) { chats = {}; }
let currentChatId = null;
let userName = localStorage.getItem('mojo_username') || '';
let selfProfile = null;
let selfHistory = [];

// ===================== NAVIGATION =====================
function showSection(section) {
  document.querySelectorAll('.btn-nav').forEach(b => b.classList.remove('active'));
  if (section === 'mojo') document.querySelectorAll('.btn-nav')[0].classList.add('active');
  else document.querySelectorAll('.btn-nav')[1].classList.add('active');
}

function goToLanding() { setActivePage('landing'); }
function goToChat() {
  setActivePage('chat-page');
  if (!userName) showNamePrompt();
  else loadOrCreateChat();
}
function goToSelf() { setActivePage('self-page'); }
function setActivePage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ===================== ABOUT MODAL =====================
function toggleAbout() { document.getElementById('about-modal').classList.toggle('show'); }
function closeAbout(e) { if (e.target === document.getElementById('about-modal')) toggleAbout(); }

// ===================== NAME PROMPT =====================
function showNamePrompt() { document.getElementById('name-prompt').classList.remove('hidden'); }
function saveName() {
  const input = document.getElementById('user-name-input');
  const name = input.value.trim();
  if (!name) return;
  userName = name;
  localStorage.setItem('mojo_username', name);
  document.getElementById('name-prompt').classList.add('hidden');
  loadOrCreateChat();
}

// ===================== CHAT MANAGEMENT =====================
function loadOrCreateChat() {
  const ids = Object.keys(chats);
  if (ids.length === 0) newChat();
  else loadChat(ids[ids.length - 1]);
  renderHistory();
}

function newChat() {
  const id = 'chat_' + Date.now();
  chats[id] = { title: 'محادثة جديدة', messages: [] };
  currentChatId = id;
  saveChats();
  renderMessages([]);
  renderHistory();
  const welcomeMsg = userName
    ? 'أهلاً يا ' + userName + '! 😊 أنا موجو. إيه اللي في بالك النهاردة؟'
    : 'أهلاً! أنا موجو. قولي إيه اللي في بالك.';
  appendMessage('ai', welcomeMsg);
  chats[currentChatId].messages.push({ role: 'assistant', content: welcomeMsg });
  saveChats();
}

function loadChat(id) {
  currentChatId = id;
  renderMessages(chats[id].messages);
  renderHistory();
}

function deleteCurrentChat() {
  if (!currentChatId || !confirm('مسح المحادثة دي؟')) return;
  delete chats[currentChatId];
  saveChats();
  currentChatId = null;
  document.getElementById('messages').innerHTML = '';
  loadOrCreateChat();
}

function saveChats() {
  try { localStorage.setItem('mojo_chats', JSON.stringify(chats)); } catch(e) {}
}

function renderHistory() {
  const container = document.getElementById('chat-history');
  container.innerHTML = '';
  Object.keys(chats).reverse().forEach(id => {
    const div = document.createElement('div');
    div.className = 'history-item' + (id === currentChatId ? ' active' : '');
    div.textContent = chats[id].title || 'محادثة';
    div.onclick = () => loadChat(id);
    container.appendChild(div);
  });
}

function renderMessages(messages) {
  const container = document.getElementById('messages');
  container.innerHTML = '';
  messages.forEach(m => appendMessage(m.role === 'user' ? 'user' : 'ai', m.content, false));
  container.scrollTop = container.scrollHeight;
}

// ===================== SEND MESSAGE =====================
async function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text || !currentChatId) return;
  input.value = '';
  input.style.height = 'auto';

  appendMessage('user', text);
  chats[currentChatId].messages.push({ role: 'user', content: text });

  if (chats[currentChatId].messages.filter(m => m.role === 'user').length === 1) {
    chats[currentChatId].title = text.slice(0, 30) + (text.length > 30 ? '...' : '');
    renderHistory();
  }
  saveChats();

  const typingId = showTyping('messages');
  const response = await callMojo(chats[currentChatId].messages);
  removeTyping(typingId);

  if (response) {
    appendMessage('ai', response);
    chats[currentChatId].messages.push({ role: 'assistant', content: response });
    saveChats();
  }
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
}
function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

// ===================== GEMINI API =====================
async function callGemini(systemText, messages) {
  const msgs = messages
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }));

  if (!msgs.length || msgs[0].role !== 'user') {
    msgs.unshift({ role: 'user', content: 'أهلاً' });
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + geminiKey,
      'HTTP-Referer': 'https://mojo-chat.app',
      'X-Title': 'Mojo Chat'
    },
    body: JSON.stringify({
      model: 'arcee-ai/trinity-large-preview:free',
      messages: [
        { role: 'system', content: systemText },
        ...msgs
      ],
      max_tokens: 1000
    })
  });
  const data = await res.json();
  if (data.error) {
    console.error('OpenRouter error:', data.error);
    return 'مشكلة في الاتصال: ' + data.error.message;
  }
  return data.choices?.[0]?.message?.content || 'معلش، مش قادر أرد دلوقتي.';
}

async function callMojo(messages) {
  try {
    const sys = userName
      ? MOJO_SYSTEM_PROMPT + '\n\nاسم المستخدم: ' + userName + '. ناديه باسمه أحياناً.'
      : MOJO_SYSTEM_PROMPT;
    return await callGemini(sys, messages);
  } catch (e) {
    console.error(e);
    return 'فيه مشكلة في الاتصال 🙏';
  }
}

// ===================== SELF TALK =====================
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('user-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveName();
  });

  document.getElementById('self-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    selfProfile = data;
    selfHistory = [];
    document.getElementById('self-form-section').classList.add('hidden');
    document.getElementById('self-chat-section').classList.remove('hidden');
    const opener = 'أهلاً يا ' + data.name + '! 🪞 أنا نسخة منك... اللي كتبته عن نفسك كان فيه صدق جميل. إيه اللي عايز تتكلم فيه النهاردة؟';
    appendSelfMessage('ai', opener);
    selfHistory.push({ role: 'assistant', content: opener });
  });
});

async function sendSelfMessage() {
  const input = document.getElementById('self-msg-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  appendSelfMessage('user', text);
  selfHistory.push({ role: 'user', content: text });
  const typingId = showTyping('self-messages');
  const response = await callSelf(selfHistory);
  removeTyping(typingId);
  if (response) {
    appendSelfMessage('ai', response);
    selfHistory.push({ role: 'assistant', content: response });
  }
}

function handleSelfKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSelfMessage(); }
}

async function callSelf(messages) {
  try {
    const p = selfProfile;
    const sys = 'أنت نسخة من شخص اسمه "' + p.name + '".\n' +
      'معلومات عنه:\n' +
      '- أكتر حاجة بيحبها: ' + p.loves + '\n' +
      '- أكتر حاجة بتضايقه: ' + p.hates + '\n' +
      '- شخصيته: ' + p.personality + '\n' +
      '- أحلامه: ' + p.dreams + '\n' +
      '- أكتر حاجة بتتعبه دلوقتي: ' + p.struggle + '\n\n' +
      'أنت بتكلم ' + p.name + ' وكأنك هو بنفسه. بتعمل سؤال أو ملاحظة واحدة بس في كل رد. كلامك بالمصري. متكونش رسمي.';
    return await callGemini(sys, messages);
  } catch (e) {
    console.error(e);
    return 'فيه مشكلة، جرب تاني 🙏';
  }
}

function resetSelfChat() {
  document.getElementById('self-form-section').classList.remove('hidden');
  document.getElementById('self-chat-section').classList.add('hidden');
  document.getElementById('self-form').reset();
  document.getElementById('self-messages').innerHTML = '';
  selfProfile = null;
  selfHistory = [];
}

// ===================== UI HELPERS =====================
function appendMessage(type, text, scroll) {
  if (scroll === undefined) scroll = true;
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = 'message ' + type;
  const initial = type === 'ai' ? 'م' : (userName ? userName[0] : 'أ');
  div.innerHTML = '<div class="msg-avatar">' + initial + '</div><div class="msg-bubble">' + escapeHtml(text) + '</div>';
  container.appendChild(div);
  if (scroll) container.scrollTop = container.scrollHeight;
}

function appendSelfMessage(type, text) {
  const container = document.getElementById('self-messages');
  const div = document.createElement('div');
  div.className = 'message ' + type;
  const initial = selfProfile ? selfProfile.name[0] : 'أ';
  div.innerHTML = '<div class="msg-avatar ' + (type === 'ai' ? 'self-av' : '') + '">' + initial + '</div><div class="msg-bubble">' + escapeHtml(text) + '</div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function showTyping(containerId) {
  const container = document.getElementById(containerId);
  const id = 'typing_' + Date.now();
  const div = document.createElement('div');
  div.className = 'message ai';
  div.id = id;
  div.innerHTML = '<div class="msg-avatar">م</div><div class="msg-bubble"><div class="typing-indicator"><span></span><span></span><span></span></div></div>';
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTyping(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}