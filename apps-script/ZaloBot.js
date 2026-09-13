/**
 * Zalo chatbot: lets the teacher run the app's CRUD (list/create/update/delete,
 * over every table in SCHEMAS) from a Zalo chat, in plain Vietnamese, via Gemini.
 *
 * Flow: Zalo POSTs every incoming message to this Web App's URL with
 * `?source=zalobot&secret=...` (see doPost in Api.js). Reads execute immediately;
 * any create/update/delete is only *proposed* (stored in CacheService keyed by
 * chat id) and applied on the teacher's next "Có" — see handleZaloWebhook_.
 *
 * Secrets (bot token, webhook secret, Gemini key, optional allow-list) live in
 * PropertiesService, never in a Sheet — the generic `list` GET route has no
 * auth at all, so nothing secret can go through the normal table CRUD path.
 */

var ZALO_API_BASE_ = 'https://bot-api.zaloplatforms.com/bot';
// gemini-3.1-flash-lite occasionally corrupts the `table` field of the
// structured JSON response (seen twice via debugGeminiIntent_ on 2026-09-13 —
// once thousands of repeated "1"s, once "congviecr-congviec:..." — neither a
// valid SCHEMAS key). Using it anyway since gemini-3.6-flash's free-tier quota
// is currently exhausted; callGeminiForIntent_ validates `table` against
// SCHEMAS and retries once before giving up, since this looks like a
// probabilistic glitch rather than something the model gets wrong every time.
var GEMINI_MODEL_DEFAULT_ = 'gemini-3.1-flash-lite';
var ZALO_PENDING_TTL_SECONDS_ = 600; // 10 minutes to confirm/cancel a proposed write

// Curated sticker ids (Zalo sticker packs) for a livelier, "gen Z" chat feel.
var ZALO_STICKERS_ = {
  greeting: '6075a81795527c0c2543', // Zapy: "Xin chào"
  done: '2b4aec28d16d3833617c', // Zapy: "Done"
  waiting: 'be7f781d4558ac06f549', // Zapy: "Chờ xíuuu"
  sorry: 'e11f38300745ed2bb464', // Cà Méo: "Xin lỗi mà"
  huh: '2d4bf264ce21277f7e30', // Cà Méo: "Thiệt hả?"
  ok: '6dcf189124d4cd8a94c5', // Rabbit: "Oke!"
};

/** Configurable in Settings so a future model deprecation (like gemini-2.0-flash's)
 * is a one-field fix instead of a code deploy. */
function getGeminiModel_() {
  return getScriptProp_('GEMINI_MODEL') || GEMINI_MODEL_DEFAULT_;
}

// ===== Config: read/write/register (called via the normal token-gated POST routes) =====

function getScriptProp_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function setScriptProp_(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

function maskSecret_(value) {
  if (!value) return '';
  if (value.length <= 6) return '••••';
  return value.slice(0, 2) + '••••' + value.slice(-4);
}

function zaloWebhookUrl_(secret) {
  return ScriptApp.getService().getUrl() + '?source=zalobot&secret=' + encodeURIComponent(secret);
}

function getBotConfig_() {
  var botToken = getScriptProp_('ZALO_BOT_TOKEN') || '';
  var webhookSecret = getScriptProp_('ZALO_WEBHOOK_SECRET') || '';
  var geminiKey = getScriptProp_('GEMINI_API_KEY') || '';
  var allowedChatId = getScriptProp_('ZALO_ALLOWED_CHAT_ID') || '';
  return {
    zaloBotTokenSet: !!botToken,
    zaloBotTokenPreview: maskSecret_(botToken),
    geminiApiKeySet: !!geminiKey,
    geminiApiKeyPreview: maskSecret_(geminiKey),
    geminiModel: getGeminiModel_(),
    webhookSecretSet: !!webhookSecret,
    allowedChatId: allowedChatId,
    webhookUrl: webhookSecret ? zaloWebhookUrl_(webhookSecret) : '',
  };
}

function setBotConfig_(data) {
  data = data || {};
  if (data.zaloBotToken) setScriptProp_('ZALO_BOT_TOKEN', data.zaloBotToken);
  if (data.geminiApiKey) setScriptProp_('GEMINI_API_KEY', data.geminiApiKey);
  if (Object.prototype.hasOwnProperty.call(data, 'geminiModel')) {
    var model = (data.geminiModel || '').trim();
    if (model) setScriptProp_('GEMINI_MODEL', model);
    else PropertiesService.getScriptProperties().deleteProperty('GEMINI_MODEL');
  }
  if (Object.prototype.hasOwnProperty.call(data, 'allowedChatId')) {
    setScriptProp_('ZALO_ALLOWED_CHAT_ID', data.allowedChatId || '');
  }
  if (!getScriptProp_('ZALO_WEBHOOK_SECRET')) {
    setScriptProp_('ZALO_WEBHOOK_SECRET', Utilities.getUuid());
  }
  return getBotConfig_();
}

function registerZaloWebhook_() {
  var botToken = getScriptProp_('ZALO_BOT_TOKEN');
  var secret = getScriptProp_('ZALO_WEBHOOK_SECRET');
  if (!botToken) throw new Error('Chưa lưu Bot Token.');
  if (!secret) throw new Error('Chưa có webhook secret — hãy lưu cấu hình trước.');
  var url = zaloWebhookUrl_(secret);
  var res = UrlFetchApp.fetch(ZALO_API_BASE_ + botToken + '/setWebhook', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ url: url, secret_token: secret }),
    muteHttpExceptions: true,
  });
  var json = JSON.parse(res.getContentText());
  if (!json.ok) throw new Error('Zalo từ chối: ' + (json.description || JSON.stringify(json)));
  return { webhookUrl: url, zaloResponse: json.result };
}

// ===== Webhook entry point =====

function handleZaloWebhook_(e) {
  var chatId = null; // hoisted so the catch below can still reply if it's known
  try {
    var secret = getScriptProp_('ZALO_WEBHOOK_SECRET');
    if (!secret || e.parameter.secret !== secret) {
      return jsonError_('Sai secret');
    }

    var body = JSON.parse(e.postData.contents);
    var result = body.result || body;
    var message = result.message;
    if (!message || !message.text) return jsonOk_({ skipped: true });

    chatId = message.chat && message.chat.id;
    var fromId = message.from && message.from.id;
    var text = String(message.text).trim();
    if (!chatId || !text) return jsonOk_({ skipped: true });

    var allowed = getScriptProp_('ZALO_ALLOWED_CHAT_ID');
    if (allowed) {
      var allowList = allowed.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      if (allowList.indexOf(String(fromId)) === -1 && allowList.indexOf(String(chatId)) === -1) {
        sendZaloMessage_(chatId, '🔒 Bạn không có quyền dùng bot này.');
        return jsonOk_({ ok: true });
      }
    }

    sendZaloChatAction_(chatId, 'typing');

    var cache = CacheService.getScriptCache();
    var pendingKey = 'zalo_pending_' + chatId;
    var draftKey = 'zalo_draft_' + chatId;
    var disambKey = 'zalo_disambiguate_' + chatId;
    var pendingRaw = cache.get(pendingKey);
    var disambRaw = cache.get(disambKey);

    if (pendingRaw) {
      handlePendingConfirmation_(cache, pendingKey, JSON.parse(pendingRaw), chatId, text);
    } else if (disambRaw) {
      // We just showed a numbered "which one did you mean?" list — a bare "1" or a
      // name fragment here answers THAT, it's not a new, context-less message.
      handleDisambiguationReply_(cache, disambKey, JSON.parse(disambRaw), chatId, text);
    } else {
      // A draft is an in-progress write we already asked a clarifying question about —
      // fold this reply into the original request and re-evaluate as one combined ask,
      // instead of treating it as an unrelated fresh message.
      var draftRaw = cache.get(draftKey);
      var effectiveText = text;
      if (draftRaw) {
        cache.remove(draftKey);
        effectiveText = JSON.parse(draftRaw).originalText + '\n' + text;
      }
      handleNewIntent_(cache, pendingKey, draftKey, chatId, effectiveText);
    }
    return jsonOk_({ ok: true });
  } catch (err) {
    Logger.log('handleZaloWebhook_ error: ' + err);
    // The teacher must ALWAYS get a reply — never just silence — so best-effort
    // tell them something broke, in its own try/catch so a second failure here
    // can't cascade. Still always 200 back to Zalo itself either way, so a
    // webhook "failure" response doesn't make it retry-storm.
    if (chatId) {
      try {
        sendZaloMessage_(chatId, '❌ ----- Lỗi hệ thống -----\n' + err + '\n-----------------------');
      } catch (sendErr) {
        Logger.log('handleZaloWebhook_ failed to send error reply: ' + sendErr);
      }
    }
    return jsonOk_({ ok: true });
  }
}

// ===== Confirm / cancel a previously-proposed write =====

function handlePendingConfirmation_(cache, pendingKey, pending, chatId, text) {
  var norm = normalizeVN_(text);
  var isYes = ['co', 'dong y', 'ok', 'xac nhan', 'duyet', 'yes'].some(function (w) { return norm.indexOf(w) !== -1; });
  var isNo = ['khong', 'huy', 'cancel', 'no'].some(function (w) { return norm.indexOf(w) !== -1; });

  if (isNo && !isYes) {
    cache.remove(pendingKey);
    sendZaloSticker_(chatId, ZALO_STICKERS_.ok);
    sendZaloMessage_(chatId, '✅ Đã huỷ nha, không có gì thay đổi đâu.');
    return;
  }
  if (!isYes) {
    sendZaloMessage_(chatId, '🤔 Bạn trả lời "Có" để xác nhận hoặc "Không" để huỷ nhé.\n\n' + pending.summary);
    return;
  }

  cache.remove(pendingKey);
  sendZaloChatAction_(chatId, 'typing');
  try {
    executePendingAction_(pending);
    sendZaloSticker_(chatId, ZALO_STICKERS_.done);
    sendZaloMessage_(chatId, '🎉 Đã thực hiện xong: ' + pending.summary);
  } catch (err) {
    sendZaloSticker_(chatId, ZALO_STICKERS_.sorry);
    sendZaloMessage_(chatId, '😥 Có lỗi khi thực hiện: ' + err.message);
  }
}

function executePendingAction_(pending) {
  var found = getSheetForTable_(pending.table);
  if (!found) throw new Error('Không tìm thấy bảng ' + pending.table);
  if (pending.action === 'create') return createRow_(found.schema, found.sheet, pending.data || {});
  if (pending.action === 'update') return updateRow_(found.schema, found.sheet, pending.id, pending.data || {});
  if (pending.action === 'delete') return deleteRow_(found.schema, found.sheet, pending.id);
  throw new Error('Hành động không hỗ trợ: ' + pending.action);
}

// ===== Answering a previously-shown "which one did you mean?" list =====

function handleDisambiguationReply_(cache, disambKey, disamb, chatId, text) {
  var trimmed = text.trim();
  var index = null;

  if (/^\d+$/.test(trimmed)) {
    var n = parseInt(trimmed, 10);
    if (n >= 1 && n <= disamb.candidates.length) index = n - 1;
  }

  if (index === null) {
    var needle = normalizeVN_(trimmed);
    var textMatches = [];
    disamb.candidates.forEach(function (c, i) {
      if (normalizeVN_(c.label).indexOf(needle) !== -1) textMatches.push(i);
    });
    if (textMatches.length === 1) index = textMatches[0];
  }

  if (index === null) {
    var norm = normalizeVN_(trimmed);
    var isNo = ['khong', 'huy', 'cancel', 'no'].some(function (w) { return norm.indexOf(w) !== -1; });
    if (isNo) {
      cache.remove(disambKey);
      sendZaloMessage_(chatId, '✅ Đã huỷ nha.');
      return;
    }
    var lines = disamb.candidates.map(function (c, i) { return (i + 1) + '. ' + c.label; });
    sendZaloMessage_(chatId, '🤔 Mình chưa xác định được, bạn chọn đúng số thứ tự giúp mình nhé:\n' + lines.join('\n'));
    return;
  }

  cache.remove(disambKey);
  var chosen = disamb.candidates[index];
  var pendingKey = 'zalo_pending_' + chatId;
  storePendingAndAsk_(
    cache,
    pendingKey,
    chatId,
    { table: disamb.table, action: disamb.action, id: chosen.id, data: disamb.data || {} },
    disamb.summary + ' — ' + chosen.label
  );
}

function storePendingAndAsk_(cache, pendingKey, chatId, pending, summary) {
  // summary is only ever read back from the cached JSON (see handlePendingConfirmation_),
  // so it must be stored on the pending object itself, not just used for this reply.
  pending.summary = summary || 'Thao tác đã đề xuất';
  cache.put(pendingKey, JSON.stringify(pending), ZALO_PENDING_TTL_SECONDS_);
  sendZaloSticker_(chatId, ZALO_STICKERS_.waiting);
  sendZaloMessage_(chatId, '📝 ' + pending.summary + '\n\n👉 Bạn xác nhận không? (Có / Không)');
}

// ===== New message → Gemini intent → read (immediate) or write (propose) =====

function handleNewIntent_(cache, pendingKey, draftKey, chatId, text) {
  if (!getScriptProp_('GEMINI_API_KEY')) {
    sendZaloMessage_(chatId, '⚠️ Chưa cấu hình Gemini API key trong Cài đặt.');
    return;
  }

  var intent = callGeminiForIntent_(text);
  if (intent && intent.intent === 'error') {
    // Surface the real Gemini error instead of a vague "didn't understand" —
    // so a quota/billing/model problem is obviously not "the bot is dumb".
    sendZaloSticker_(chatId, ZALO_STICKERS_.sorry);
    sendZaloMessage_(chatId, '❌ ----- Lỗi Gemini -----\n' + intent.errorMessage + '\n-----------------------');
    return;
  }
  if (!intent) {
    sendZaloSticker_(chatId, ZALO_STICKERS_.huh);
    sendZaloMessage_(chatId, '😅 Xin lỗi, mình chưa hiểu yêu cầu này á. Bạn thử diễn đạt lại nhé!');
    return;
  }

  if (intent.intent === 'chat' || !intent.table) {
    sendZaloSticker_(chatId, ZALO_STICKERS_.greeting);
    sendZaloMessage_(chatId, intent.summary || intent.clarifyingQuestion || '🤗 Bạn nói rõ hơn được không?');
    return;
  }

  var found = getSheetForTable_(intent.table);
  if (!found) {
    sendZaloSticker_(chatId, ZALO_STICKERS_.sorry);
    sendZaloMessage_(chatId, '😥 Mình không tìm thấy dữ liệu "' + intent.table + '".');
    return;
  }

  // Gemini flagged missing required info for a write — don't propose anything
  // yet. Remember the conversation so far (draftKey) and ask; the reply gets
  // appended to this same text and re-sent as one combined request (see
  // handleZaloWebhook_), so the bot keeps asking until the request is complete.
  if (intent.intent === 'write' && intent.clarifyingQuestion) {
    cache.put(draftKey, JSON.stringify({ originalText: text }), ZALO_PENDING_TTL_SECONDS_);
    sendZaloSticker_(chatId, ZALO_STICKERS_.huh);
    sendZaloMessage_(chatId, '❓ ' + intent.clarifyingQuestion);
    return;
  }

  if (intent.intent === 'read') {
    handleReadIntent_(found, intent, chatId, text);
    return;
  }

  if (intent.intent === 'write') {
    handleWriteIntent_(cache, pendingKey, draftKey, found, intent, chatId, text);
    return;
  }

  sendZaloMessage_(chatId, intent.summary || 'Mình chưa rõ ý bạn.');
}

function handleReadIntent_(found, intent, chatId, originalText) {
  var rows = listRows_(found.schema, found.sheet);
  rows = applyFilters_(rows, intent.filters);

  // A temp-Sheet export used to be offered here for long lists, but it needs
  // Drive access — which repeatedly failed to authorize on this account (the
  // consent screen wasn't even appearing) — so it's dropped in favor of the
  // always-available phrased summary below, which already handles large lists
  // fine (phraseReadResult_ caps what it sends Gemini and notes the cutoff).

  sendZaloMessage_(chatId, phraseReadResult_(originalText, intent, rows));
}

// (Temp-Sheet export + its cleanup trigger were removed here — see the note
// in handleReadIntent_ above. They needed Drive access that wouldn't
// authorize on this account.)

function applyFilters_(rows, filters) {
  if (!filters || !filters.length) return rows;
  return rows.filter(function (row) {
    return filters.every(function (f) {
      var v = row[f.field];
      if (v === undefined || v === null || v === '') return false;
      if (f.op === 'gte') return String(v) >= String(f.value);
      if (f.op === 'lte') return String(v) <= String(f.value);
      var a = normalizeVN_(String(v));
      var b = normalizeVN_(String(f.value));
      return f.op === 'eq' ? a === b : a.indexOf(b) !== -1; // default: contains
    });
  });
}

function phraseReadResult_(question, intent, rows) {
  var capped = rows.slice(0, 30);
  var prompt =
    'Câu hỏi của giáo viên: "' + question + '"\n' +
    'Dữ liệu thực tế (bảng "' + intent.table + '", JSON) — CHỈ dùng đúng dữ liệu này, không bịa thêm:\n' +
    JSON.stringify(capped) +
    (rows.length > capped.length ? '\n(còn ' + (rows.length - capped.length) + ' dòng nữa không hiển thị hết)' : '') +
    '\nTrả lời ngắn gọn, tự nhiên, giọng thân thiện gen Z, chèn 1-2 emoji phù hợp, bằng tiếng Việt.';
  return callGeminiText_(prompt) || ('Tìm thấy ' + rows.length + ' kết quả.');
}

function handleWriteIntent_(cache, pendingKey, draftKey, found, intent, chatId, text) {
  var action = intent.action;

  if (action === 'create') {
    // gemini-3.1-flash-lite's structured-output glitches (see the model-choice
    // comment up top) have twice come back with intent="write"/action="create"
    // and a plausible `summary`, but `data` empty — the teacher then confirms
    // "Có" against a normal-looking prompt and a fully blank row gets created
    // (every column ''). Refuse to even propose a create with no real content,
    // same "ask and remember" pattern as the missing matchField/matchValue case
    // below, instead of silently writing garbage into the Sheet.
    var hasContent = intent.data && Object.keys(intent.data).some(function (k) {
      var v = intent.data[k];
      return v !== null && v !== undefined && String(v).trim() !== '';
    });
    if (!hasContent) {
      cache.put(draftKey, JSON.stringify({ originalText: text }), ZALO_PENDING_TTL_SECONDS_);
      sendZaloSticker_(chatId, ZALO_STICKERS_.huh);
      sendZaloMessage_(chatId, '🤔 Mình chưa nắm được nội dung cụ thể để tạo mới — bạn nói rõ hơn giúp mình nhé (vd tiêu đề, ngày giờ...).');
      return;
    }
    storePendingAndAsk_(cache, pendingKey, chatId, { table: intent.table, action: 'create', data: intent.data }, intent.summary);
    return;
  }

  if (action === 'update' || action === 'delete') {
    if (!intent.matchField || !intent.matchValue) {
      // Same "ask and remember" as the missing-info branch in handleNewIntent_ —
      // the next reply gets folded into this request instead of starting fresh.
      cache.put(draftKey, JSON.stringify({ originalText: text }), ZALO_PENDING_TTL_SECONDS_);
      sendZaloMessage_(chatId, '🤔 ' + (intent.clarifyingQuestion || 'Bạn cho mình biết muốn sửa/xoá dòng nào (ví dụ theo tên) nhé.'));
      return;
    }
    var rows = listRows_(found.schema, found.sheet);
    var needle = normalizeVN_(String(intent.matchValue));
    var matches = rows.filter(function (r) {
      var v = r[intent.matchField];
      return v != null && normalizeVN_(String(v)).indexOf(needle) !== -1;
    });
    if (matches.length === 0) {
      sendZaloSticker_(chatId, ZALO_STICKERS_.sorry);
      sendZaloMessage_(chatId, '😥 Không tìm thấy "' + intent.matchValue + '" trong dữ liệu.');
      return;
    }
    if (matches.length > 1) {
      var candidates = matches.slice(0, 8).map(function (r) {
        return { id: r.id, label: (r[intent.matchField] || '') + (r.hoVaTen && intent.matchField !== 'hoVaTen' ? ' — ' + r.hoVaTen : '') };
      });
      // Remember the exact list we just showed so a bare "1" (or a name
      // fragment) on the next message picks one of THESE, not a fresh Gemini
      // guess with no idea a list was ever shown — see handleDisambiguationReply_.
      cache.put(
        'zalo_disambiguate_' + chatId,
        JSON.stringify({ table: intent.table, action: action, data: intent.data || {}, summary: intent.summary, candidates: candidates }),
        ZALO_PENDING_TTL_SECONDS_
      );
      sendZaloSticker_(chatId, ZALO_STICKERS_.huh);
      var lines = candidates.map(function (c, i) { return (i + 1) + '. ' + c.label; });
      sendZaloMessage_(chatId, '🧐 Có nhiều kết quả khớp nè, bạn chọn số thứ tự hoặc nhắn rõ hơn nhé:\n' + lines.join('\n'));
      return;
    }
    storePendingAndAsk_(
      cache,
      pendingKey,
      chatId,
      { table: intent.table, action: action, id: matches[0].id, data: intent.data || {} },
      intent.summary
    );
    return;
  }

  sendZaloMessage_(chatId, '🙈 Hành động này mình chưa hỗ trợ.');
}

// ===== Gemini =====

function buildSchemaDescription_() {
  return Object.keys(SCHEMAS)
    .map(function (key) {
      var cols = SCHEMAS[key].columns
        .filter(function (c) { return ['id', 'createdAt', 'updatedAt'].indexOf(c.key) === -1; })
        .map(function (c) { return c.key + ' (' + c.header + ', ' + c.type + ')'; })
        .join(', ');
      return '- ' + key + ': ' + cols;
    })
    .join('\n');
}

var INTENT_RESPONSE_SCHEMA_ = {
  type: 'OBJECT',
  properties: {
    intent: { type: 'STRING', enum: ['read', 'write', 'chat'] },
    action: { type: 'STRING', enum: ['list', 'create', 'update', 'delete'], nullable: true },
    table: { type: 'STRING', nullable: true },
    data: { type: 'OBJECT', nullable: true },
    matchField: { type: 'STRING', nullable: true },
    matchValue: { type: 'STRING', nullable: true },
    filters: {
      type: 'ARRAY',
      nullable: true,
      items: {
        type: 'OBJECT',
        properties: {
          field: { type: 'STRING' },
          op: { type: 'STRING', enum: ['contains', 'eq', 'gte', 'lte'] },
          value: { type: 'STRING' },
        },
      },
    },
    summary: { type: 'STRING' },
    clarifyingQuestion: { type: 'STRING', nullable: true },
  },
  required: ['intent', 'summary'],
};

function buildIntentPayload_(userText) {
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  var systemPrompt =
    'Bạn là trợ lý của một giáo viên, thao tác qua các bảng dữ liệu sau (Google Sheet):\n' +
    buildSchemaDescription_() +
    '\n\nHôm nay là ngày ' + today + '.\n' +
    'Đọc yêu cầu của giáo viên, trả về DUY NHẤT 1 JSON object mô tả hành động, đúng schema đã cho.\n' +
    '- intent="read": chỉ xem/tra cứu — action="list", có thể kèm filters lọc theo field.\n' +
    '- intent="write": thêm/sửa/xoá — action="create"/"update"/"delete". Với update/delete PHẢI cho matchField (tên field, KHÔNG PHẢI id) và matchValue (giá trị để tìm dòng, vd tên học sinh) — KHÔNG được tự bịa id. Với create, điền data bằng các field hợp lệ của bảng.\n' +
    '- intent="chat": chào hỏi / ngoài phạm vi dữ liệu — chỉ cần summary là câu trả lời.\n' +
    'summary luôn là 1 câu tiếng Việt ngắn gọn mô tả việc sẽ làm (dùng làm lời xác nhận) hoặc câu trả lời trò chuyện, giọng thân thiện gen Z, có thể chèn emoji phù hợp.\n' +
    'Thiếu thông tin bắt buộc thì để field đó null và nêu rõ trong clarifyingQuestion.';

  return {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] },
    generationConfig: { responseMimeType: 'application/json', responseSchema: INTENT_RESPONSE_SCHEMA_ },
  };
}

function callGeminiForIntent_(userText, isRetry) {
  try {
    var json = callGeminiRaw_(buildIntentPayload_(userText));
    var parsed = JSON.parse(json.candidates[0].content.parts[0].text);
    if (parsed.table && !SCHEMAS.hasOwnProperty(parsed.table)) {
      // A garbled/hallucinated table name — retry once (this has been a
      // probabilistic glitch, not deterministic) before surfacing an error,
      // so the teacher isn't shown a wall of repeated garbage characters.
      if (!isRetry) return callGeminiForIntent_(userText, true);
      return { intent: 'error', errorMessage: 'Model trả về tên bảng không hợp lệ, đã thử lại vẫn lỗi. Bạn thử nhắn lại nhé.' };
    }
    return parsed;
  } catch (err) {
    Logger.log('callGeminiForIntent_ error: ' + err);
    // A real Gemini/network failure (quota, billing, bad model id, ...) should
    // never look like "I didn't understand you" — surface it as-is instead.
    return { intent: 'error', errorMessage: String(err) };
  }
}

/** Diagnostic (Settings can call this via a debug action): runs the exact same
 * intent-classification call as the chat flow, but WITHOUT swallowing errors —
 * surfaces the raw Gemini response/finishReason so a silent "mình chưa hiểu"
 * in chat can actually be root-caused instead of guessed at. */
function debugGeminiIntent_(data) {
  var text = (data && data.text) || '';
  if (!text) throw new Error('Thiếu text.');
  var json = callGeminiRaw_(buildIntentPayload_(text));
  var candidate = json.candidates && json.candidates[0];
  var rawText = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0] && candidate.content.parts[0].text;
  var parsed = null;
  var parseError = null;
  try {
    parsed = rawText ? JSON.parse(rawText) : null;
  } catch (err) {
    parseError = String(err);
  }
  return {
    finishReason: candidate && candidate.finishReason,
    rawText: rawText || null,
    parsed: parsed,
    parseError: parseError,
    promptFeedback: json.promptFeedback || null,
  };
}

function callGeminiText_(prompt) {
  try {
    var json = callGeminiRaw_({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    return json.candidates[0].content.parts[0].text;
  } catch (err) {
    Logger.log('callGeminiText_ error: ' + err);
    return null;
  }
}

function callGeminiRaw_(payload) {
  var apiKey = getScriptProp_('GEMINI_API_KEY');
  var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + getGeminiModel_() + ':generateContent?key=' + encodeURIComponent(apiKey);
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  var json = JSON.parse(res.getContentText());
  if (json.error) {
    throw new Error('Gemini từ chối (HTTP ' + res.getResponseCode() + '): ' + json.error.message);
  }
  return json;
}

/** Diagnostic action (called from Settings' "Kiểm tra Gemini key" button): surfaces the
 * real Gemini error instead of the generic "mình chưa hiểu" fallback the chat flow gives. */
function testGeminiKey_() {
  if (!getScriptProp_('GEMINI_API_KEY')) throw new Error('Chưa lưu Gemini API key.');
  var json = callGeminiRaw_({ contents: [{ role: 'user', parts: [{ text: 'Xin chào' }] }] });
  var text = json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts[0].text;
  return { reply: text || JSON.stringify(json) };
}

// ===== Zalo send + shared text helper =====

function sendZaloMessage_(chatId, text) {
  var botToken = getScriptProp_('ZALO_BOT_TOKEN');
  if (!botToken) return;
  try {
    var res = UrlFetchApp.fetch(ZALO_API_BASE_ + botToken + '/sendMessage', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: String(chatId), text: String(text).slice(0, 2000) }),
      muteHttpExceptions: true,
    });
    var json = JSON.parse(res.getContentText());
    if (!json.ok) {
      // This was previously fire-and-forget with zero visibility — a failed
      // send here (bad chat_id, Zalo-side error, ...) looked identical to
      // total silence from the teacher's side. Record it so debugLastSendError
      // can surface exactly what Zalo said instead of guessing.
      var detail = 'HTTP ' + res.getResponseCode() + ': ' + res.getContentText();
      Logger.log('sendZaloMessage_ failed: ' + detail);
      setScriptProp_('LAST_SEND_ERROR', detail);
    }
  } catch (err) {
    Logger.log('sendZaloMessage_ exception: ' + err);
    setScriptProp_('LAST_SEND_ERROR', String(err));
  }
}

/** Diagnostic: what did the last failed sendZaloMessage_ actually say from
 * Zalo's side? (fire-and-forget sends have no other way to surface this) */
function debugLastSendError_() {
  return { lastSendError: getScriptProp_('LAST_SEND_ERROR') || null };
}

/** Best-effort — a failed sticker/chat-action send should never break the
 * actual reply, so both of these swallow their own errors. */
function sendZaloSticker_(chatId, stickerId) {
  var botToken = getScriptProp_('ZALO_BOT_TOKEN');
  if (!botToken || !stickerId) return;
  try {
    UrlFetchApp.fetch(ZALO_API_BASE_ + botToken + '/sendSticker', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: String(chatId), sticker: stickerId }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log('sendZaloSticker_ error: ' + err);
  }
}

function sendZaloChatAction_(chatId, action) {
  var botToken = getScriptProp_('ZALO_BOT_TOKEN');
  if (!botToken) return;
  try {
    UrlFetchApp.fetch(ZALO_API_BASE_ + botToken + '/sendChatAction', {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: String(chatId), action: action }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log('sendZaloChatAction_ error: ' + err);
  }
}

function normalizeVN_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
