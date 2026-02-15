/**
 * Storage Manager v2.0 — 4-Layer Hybrid Storage Router + Supabase 연결
 *
 * 라우팅 기준 (2축):
 *   민감도: 공개(public) → Supabase / 비공개(private) → 로컬
 *   크기:   소량(< 5MB) → DB / 대용량(≥ 5MB) → 파일 저장소
 *
 * ┌─────────────┬──────────────────┬─────────────────────┐
 * │             │ 소량 (< 5MB)     │ 대용량 (≥ 5MB)       │
 * ├─────────────┼──────────────────┼─────────────────────┤
 * │ 공개/일반    │ Supabase DB      │ Supabase Storage    │
 * │ 비공개/민감  │ IndexedDB        │ PC 로컬 파일         │
 * └─────────────┴──────────────────┴─────────────────────┘
 *
 * localStorage: 세션/UI 설정 전용 (< 1KB 키-값)
 */

const StorageManager = (() => {

  // ─── Constants ───
  const SIZE_THRESHOLD = 5 * 1024 * 1024; // 5MB
  const IDB_NAME = 'mcw_storage';
  const IDB_VERSION = 1;
  const IDB_STORE = 'data';
  const SB_BUCKET = 'kb-files';

  // ─── Supabase Client ───
  let _sb = null;

  function getSupabase() {
    if (_sb) return _sb;
    // supabase-js CDN은 window.supabase.createClient 제공
    if (typeof window !== 'undefined' && window.supabase && window.supabase.createClient) {
      const url = (typeof MCW_SECRETS !== 'undefined' && MCW_SECRETS.SUPABASE_URL) || '';
      const key = (typeof MCW_SECRETS !== 'undefined' && MCW_SECRETS.SUPABASE_ANON_KEY) || '';
      if (url && key) {
        _sb = window.supabase.createClient(url, key);
        capabilities.supabase = true;
        console.log('[StorageManager] Supabase connected:', url);
        return _sb;
      }
    }
    return null;
  }

  // ─── Data Category Definitions ───
  const CATEGORIES = {
    // UI 설정 (초경량, 즉시 접근)
    'setting':             { private: false, storage: 'localStorage' },
    'session':             { private: true,  storage: 'localStorage' },

    // 공개 데이터 → Supabase
    'bot-profile':         { private: false, storage: 'supabase', table: 'mcw_bots' },
    'avatar-persona':      { private: false, storage: 'supabase', table: 'mcw_personas' },
    'public-faq':          { private: false, storage: 'supabase', table: 'mcw_kb_items' },
    'public-greeting':     { private: false, storage: 'supabase', table: 'mcw_bots' },

    // 비공개 소량 → IndexedDB
    'helper-persona':      { private: true,  storage: 'indexedDB' },
    'interview-text':      { private: true,  storage: 'indexedDB' },
    'chat-log':            { private: true,  storage: 'indexedDB' },
    'personal-note':       { private: true,  storage: 'indexedDB' },
    'kb-qa':               { private: true,  storage: 'indexedDB' },
    'kb-text':             { private: true,  storage: 'indexedDB' },

    // 비공개 대용량 → PC 파일
    'voice-recording':     { private: true,  storage: 'pcFile' },
    'kb-document':         { private: true,  storage: 'pcFile' },
    'conversation-export': { private: true,  storage: 'pcFile' },
    'backup':              { private: true,  storage: 'pcFile' }
  };

  // ─── Capability Detection ───
  const capabilities = {
    indexedDB: typeof indexedDB !== 'undefined',
    fileSystem: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
    supabase: false  // getSupabase() 호출 시 자동 업데이트
  };

  // ─── Route: 카테고리 + 크기 → 저장소 결정 ───
  function route(category, sizeBytes = 0) {
    const cat = CATEGORIES[category];
    if (!cat) return 'indexedDB';

    if (cat.storage === 'localStorage') return 'localStorage';

    const isPrivate = cat.private;
    const isLarge = sizeBytes >= SIZE_THRESHOLD;

    if (isPrivate) {
      if (isLarge) return capabilities.fileSystem ? 'pcFile' : 'indexedDB';
      return 'indexedDB';
    } else {
      // 공개 데이터
      getSupabase(); // 연결 시도
      if (!capabilities.supabase) return 'localStorage'; // 미연결 폴백
      return isLarge ? 'supabaseStorage' : 'supabaseDB';
    }
  }


  // ═══════════════════════════════════════════════
  // IndexedDB Layer
  // ═══════════════════════════════════════════════

  function openIDB() {
    return new Promise((resolve, reject) => {
      if (!capabilities.indexedDB) { reject(new Error('IndexedDB not supported')); return; }
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          const store = db.createObjectStore(IDB_STORE, { keyPath: 'key' });
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('botId', 'botId', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function idbPut(key, category, data, meta = {}) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const record = {
        key, category, data,
        botId: meta.botId || null,
        createdAt: meta.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function idbGet(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result?.data ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function idbGetByCategory(category, botId = null) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const index = store.index('category');
      const req = index.getAll(category);
      req.onsuccess = () => {
        let results = req.result || [];
        if (botId) results = results.filter(r => r.botId === botId);
        resolve(results.map(r => ({ key: r.key, data: r.data, updatedAt: r.updatedAt })));
      };
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function idbDelete(key) {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  }


  // ═══════════════════════════════════════════════
  // PC Local File Layer (File System Access API)
  // ═══════════════════════════════════════════════

  let _dirHandle = null;

  async function getPCDirectory() {
    if (_dirHandle) return _dirHandle;
    if (!capabilities.fileSystem) {
      throw new Error('File System Access API not supported. Chrome/Edge 86+ required.');
    }
    _dirHandle = await window.showDirectoryPicker({
      id: 'mcw-data', mode: 'readwrite', startIn: 'documents'
    });
    return _dirHandle;
  }

  async function pcFileSave(filename, data, options = {}) {
    const dir = await getPCDirectory();
    const subDir = options.subDir || 'mychatbot-data';
    let folder;
    try { folder = await dir.getDirectoryHandle(subDir, { create: true }); }
    catch { folder = dir; }

    const fileHandle = await folder.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    if (typeof data === 'string') await writable.write(data);
    else if (data instanceof Blob) await writable.write(data);
    else await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return { filename, subDir, savedAt: new Date().toISOString() };
  }

  async function pcFileLoad(filename, options = {}) {
    const dir = await getPCDirectory();
    const subDir = options.subDir || 'mychatbot-data';
    let folder;
    try { folder = await dir.getDirectoryHandle(subDir); } catch { return null; }
    try {
      const fileHandle = await folder.getFileHandle(filename);
      const file = await fileHandle.getFile();
      if (options.asBlob) return file;
      if (options.asArrayBuffer) return await file.arrayBuffer();
      const text = await file.text();
      if (options.json !== false) {
        try { return JSON.parse(text); } catch { /* not JSON */ }
      }
      return text;
    } catch { return null; }
  }

  async function pcFileDelete(filename, options = {}) {
    const dir = await getPCDirectory();
    const subDir = options.subDir || 'mychatbot-data';
    try {
      const folder = await dir.getDirectoryHandle(subDir);
      await folder.removeEntry(filename);
      return true;
    } catch { return false; }
  }

  async function pcFileList(options = {}) {
    const dir = await getPCDirectory();
    const subDir = options.subDir || 'mychatbot-data';
    try {
      const folder = await dir.getDirectoryHandle(subDir);
      const files = [];
      for await (const [name, handle] of folder) {
        if (handle.kind === 'file') {
          const file = await handle.getFile();
          files.push({ name, size: file.size, lastModified: file.lastModified });
        }
      }
      return files;
    } catch { return []; }
  }

  function downloadFile(filename, data) {
    let blob;
    if (data instanceof Blob) blob = data;
    else if (typeof data === 'string') blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    else blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }


  // ═══════════════════════════════════════════════
  // Supabase DB Layer
  // ═══════════════════════════════════════════════

  /**
   * Supabase 테이블에 upsert
   * @param {string} table - 테이블명 (mcw_bots, mcw_personas, mcw_kb_items)
   * @param {Object} data - 저장할 데이터 (id 포함)
   */
  async function supabaseSave(table, data) {
    const sb = getSupabase();
    if (!sb) {
      console.warn('[StorageManager] Supabase unavailable, localStorage fallback');
      const key = `mcw_sb_${table}_${data.id || Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      return data;
    }

    const payload = {
      ...data,
      updated_at: new Date().toISOString()
    };
    if (!payload.created_at) payload.created_at = new Date().toISOString();

    const { data: result, error } = await sb
      .from(table)
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] save error:', table, error.message);
      // 테이블 없을 수도 있으니 localStorage 폴백
      const key = `mcw_sb_${table}_${data.id || Date.now()}`;
      localStorage.setItem(key, JSON.stringify(data));
      return data;
    }
    return result;
  }

  /**
   * Supabase 테이블에서 단일 로드
   */
  async function supabaseGet(table, id) {
    const sb = getSupabase();
    if (!sb) {
      const key = `mcw_sb_${table}_${id}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }

    const { data, error } = await sb
      .from(table)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[Supabase] get error:', table, id, error.message);
      // localStorage 폴백 시도
      const key = `mcw_sb_${table}_${id}`;
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    return data;
  }

  /**
   * Supabase 테이블에서 필터 조회
   */
  async function supabaseQuery(table, filters = {}) {
    const sb = getSupabase();
    if (!sb) return [];

    let query = sb.from(table).select('*');
    for (const [col, val] of Object.entries(filters)) {
      query = query.eq(col, val);
    }
    const { data, error } = await query;
    if (error) {
      console.error('[Supabase] query error:', table, error.message);
      return [];
    }
    return data || [];
  }

  /**
   * Supabase 테이블에서 삭제
   */
  async function supabaseDelete(table, id) {
    const sb = getSupabase();
    if (!sb) {
      localStorage.removeItem(`mcw_sb_${table}_${id}`);
      return true;
    }

    const { error } = await sb.from(table).delete().eq('id', id);
    if (error) {
      console.error('[Supabase] delete error:', table, id, error.message);
      return false;
    }
    return true;
  }


  // ═══════════════════════════════════════════════
  // Supabase Storage Layer
  // ═══════════════════════════════════════════════

  /**
   * Supabase Storage에 파일 업로드
   * @param {string} path - Storage 내 경로 (예: "botId/filename.pdf")
   * @param {Blob|File} blob - 업로드할 파일
   * @param {Object} options - { contentType, upsert }
   */
  async function supabaseStorageSave(path, blob, options = {}) {
    const sb = getSupabase();
    if (!sb) {
      console.warn('[StorageManager] Supabase Storage unavailable, download fallback');
      downloadFile(path.split('/').pop() || 'file', blob);
      return { path, fallback: true };
    }

    const contentType = options.contentType || blob.type || 'application/octet-stream';
    const { data, error } = await sb.storage
      .from(SB_BUCKET)
      .upload(path, blob, { contentType, upsert: options.upsert !== false });

    if (error) {
      console.error('[Supabase Storage] upload error:', path, error.message);
      downloadFile(path.split('/').pop() || 'file', blob);
      return { path, fallback: true, error: error.message };
    }
    return { path: data.path, fullPath: data.fullPath || data.path };
  }

  /**
   * Supabase Storage에서 파일 다운로드
   */
  async function supabaseStorageGet(path, options = {}) {
    const sb = getSupabase();
    if (!sb) return null;

    const { data, error } = await sb.storage.from(SB_BUCKET).download(path);
    if (error) {
      console.error('[Supabase Storage] download error:', path, error.message);
      return null;
    }

    if (options.asBlob) return data;
    if (options.asArrayBuffer) return await data.arrayBuffer();
    const text = await data.text();
    if (options.json !== false) {
      try { return JSON.parse(text); } catch { /* not JSON */ }
    }
    return text;
  }

  /**
   * Supabase Storage에서 파일 삭제
   */
  async function supabaseStorageDelete(path) {
    const sb = getSupabase();
    if (!sb) return false;

    const { error } = await sb.storage.from(SB_BUCKET).remove([path]);
    if (error) {
      console.error('[Supabase Storage] delete error:', path, error.message);
      return false;
    }
    return true;
  }

  /**
   * Supabase Storage 파일 공개 URL
   */
  function supabaseStorageUrl(path) {
    const sb = getSupabase();
    if (!sb) return null;
    const { data } = sb.storage.from(SB_BUCKET).getPublicUrl(path);
    return data?.publicUrl || null;
  }

  /**
   * Supabase Storage 파일 목록
   */
  async function supabaseStorageList(folder = '') {
    const sb = getSupabase();
    if (!sb) return [];

    const { data, error } = await sb.storage.from(SB_BUCKET).list(folder);
    if (error) {
      console.error('[Supabase Storage] list error:', error.message);
      return [];
    }
    return (data || []).map(f => ({
      name: f.name,
      size: f.metadata?.size || 0,
      createdAt: f.created_at
    }));
  }


  // ═══════════════════════════════════════════════
  // Unified API
  // ═══════════════════════════════════════════════

  /**
   * 데이터를 적절한 저장소에 저장
   * @param {string} category - 데이터 카테고리 (CATEGORIES 참조)
   * @param {string} key - 고유 키
   * @param {*} data - 저장할 데이터
   * @param {Object} meta - { botId, filename, subDir, table, ... }
   */
  async function save(category, key, data, meta = {}) {
    const sizeBytes = estimateSize(data);
    const storage = route(category, sizeBytes);

    switch (storage) {
      case 'localStorage':
        localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
        return { storage, key, savedAt: new Date().toISOString() };

      case 'indexedDB':
        await idbPut(key, category, data, meta);
        return { storage, key, savedAt: new Date().toISOString() };

      case 'pcFile': {
        const filename = meta.filename || key.replace(/[^a-zA-Z0-9가-힣_-]/g, '_') + '.json';
        const result = await pcFileSave(filename, data, meta);
        await idbPut(key, category, { _fileRef: true, filename, ...result }, meta);
        return { storage, key, filename, savedAt: result.savedAt };
      }

      case 'supabaseDB': {
        const table = CATEGORIES[category]?.table || meta.table || 'mcw_kb_items';
        const payload = typeof data === 'object' && !Array.isArray(data) ? { id: key, ...data } : { id: key, data };
        if (meta.botId) payload.bot_id = meta.botId;
        payload.category = category;
        const result = await supabaseSave(table, payload);
        return { storage, key, table, savedAt: new Date().toISOString(), result };
      }

      case 'supabaseStorage': {
        const path = meta.storagePath || `${meta.botId || 'global'}/${meta.filename || key}`;
        const blob = data instanceof Blob ? data : new Blob([typeof data === 'string' ? data : JSON.stringify(data)]);
        const result = await supabaseStorageSave(path, blob, meta);
        // DB에 메타 정보 기록
        await supabaseSave('mcw_kb_items', {
          id: key,
          bot_id: meta.botId || null,
          category,
          storage_path: result.path,
          file_size: sizeBytes,
          created_at: new Date().toISOString()
        });
        return { storage, key, path: result.path, savedAt: new Date().toISOString() };
      }

      default:
        throw new Error('Unknown storage: ' + storage);
    }
  }

  /**
   * 데이터를 저장소에서 로드
   */
  async function load(category, key, meta = {}) {
    const cat = CATEGORIES[category];
    if (!cat) return null;

    // 실제 라우팅 기준으로 storage 결정 (연결 상태 반영)
    const storage = route(category, 0);

    switch (storage) {
      case 'localStorage': {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        try { return JSON.parse(raw); } catch { return raw; }
      }

      case 'indexedDB': {
        const data = await idbGet(key);
        if (data && data._fileRef) return await pcFileLoad(data.filename, meta);
        return data;
      }

      case 'pcFile': {
        const ref = await idbGet(key);
        if (ref && ref.filename) return await pcFileLoad(ref.filename, meta);
        const filename = meta.filename || key.replace(/[^a-zA-Z0-9가-힣_-]/g, '_') + '.json';
        return await pcFileLoad(filename, meta);
      }

      case 'supabaseDB': {
        const table = cat.table || meta.table || 'mcw_kb_items';
        const result = await supabaseGet(table, key);
        if (!result) return null;
        return result.data !== undefined ? result.data : result;
      }

      case 'supabaseStorage': {
        // DB에서 storage_path 조회
        const record = await supabaseGet('mcw_kb_items', key);
        if (!record || !record.storage_path) return null;
        return await supabaseStorageGet(record.storage_path, meta);
      }

      default:
        return null;
    }
  }

  /**
   * 데이터 삭제
   */
  async function remove(category, key, meta = {}) {
    const storage = route(category, 0);

    switch (storage) {
      case 'localStorage':
        localStorage.removeItem(key);
        return true;

      case 'indexedDB': {
        const data = await idbGet(key);
        if (data && data._fileRef) await pcFileDelete(data.filename, meta);
        return await idbDelete(key);
      }

      case 'pcFile': {
        const ref = await idbGet(key);
        if (ref && ref.filename) await pcFileDelete(ref.filename, meta);
        return await idbDelete(key);
      }

      case 'supabaseDB': {
        const table = CATEGORIES[category]?.table || 'mcw_kb_items';
        return await supabaseDelete(table, key);
      }

      case 'supabaseStorage': {
        const record = await supabaseGet('mcw_kb_items', key);
        if (record && record.storage_path) {
          await supabaseStorageDelete(record.storage_path);
        }
        return await supabaseDelete('mcw_kb_items', key);
      }

      default:
        return false;
    }
  }

  /**
   * 특정 카테고리의 모든 데이터 목록
   */
  async function list(category, botId = null) {
    const storage = route(category, 0);

    switch (storage) {
      case 'localStorage': {
        const prefix = `mcw_sb_${category}_`;
        const results = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key.startsWith(prefix)) {
            results.push({ key, data: JSON.parse(localStorage.getItem(key) || 'null') });
          }
        }
        return results;
      }

      case 'supabaseDB':
      case 'supabaseStorage': {
        const filters = { category };
        if (botId) filters.bot_id = botId;
        const table = CATEGORIES[category]?.table || 'mcw_kb_items';
        return await supabaseQuery(table, filters);
      }

      default:
        return await idbGetByCategory(category, botId);
    }
  }


  // ─── Helpers ───

  function estimateSize(data) {
    if (data instanceof Blob) return data.size;
    if (data instanceof ArrayBuffer) return data.byteLength;
    if (typeof data === 'string') return new Blob([data]).size;
    return new Blob([JSON.stringify(data)]).size;
  }

  function getCapabilities() {
    getSupabase(); // 최신 상태 반영
    return { ...capabilities };
  }

  function getRoute(category, sizeBytes = 0) {
    return route(category, sizeBytes);
  }

  function getCategoryInfo(category) {
    return CATEGORIES[category] || null;
  }


  // ═══════════════════════════════════════════════
  // Knowledge Base Convenience Methods
  // ═══════════════════════════════════════════════

  /**
   * 지식베이스 전체를 저장소 라우팅에 따라 분산 저장
   */
  async function saveKnowledgeBase(botId, kb) {
    const results = [];

    // Q&A → IndexedDB (비공개, 소량)
    if (kb.qaPairs && kb.qaPairs.length > 0) {
      results.push(await save('kb-qa', `kb_qa_${botId}`, kb.qaPairs, { botId }));
    }

    // 자유 텍스트 → IndexedDB (비공개, 소량)
    if (kb.freeText) {
      results.push(await save('kb-text', `kb_text_${botId}`, kb.freeText, { botId }));
    }

    // 파일 → 크기에 따라 IndexedDB 또는 PC 파일
    if (kb.files && kb.files.length > 0) {
      for (const file of kb.files) {
        const sizeBytes = estimateSize(file.content);
        const category = sizeBytes >= SIZE_THRESHOLD ? 'kb-document' : 'kb-text';
        const key = `kb_file_${botId}_${file.name}`;
        results.push(await save(category, key, file.content, {
          botId, filename: `${botId}_${file.name}`
        }));
      }
    }

    // URL 목록 → IndexedDB (소량 메타데이터)
    if (kb.urls && kb.urls.length > 0) {
      results.push(await save('kb-text', `kb_urls_${botId}`, kb.urls, { botId }));
    }

    // 저장 인덱스
    const index = {
      hasQA: (kb.qaPairs?.length || 0) > 0,
      hasFreeText: !!kb.freeText,
      fileCount: kb.files?.length || 0,
      fileNames: (kb.files || []).map(f => f.name),
      urlCount: kb.urls?.length || 0,
      savedAt: new Date().toISOString()
    };
    await save('kb-text', `kb_index_${botId}`, index, { botId });

    return { botId, results, index };
  }

  /**
   * 지식베이스 전체를 로드
   */
  async function loadKnowledgeBase(botId) {
    const kb = { qaPairs: [], freeText: '', files: [], urls: [] };

    const qaPairs = await load('kb-qa', `kb_qa_${botId}`);
    if (qaPairs) kb.qaPairs = qaPairs;

    const freeText = await load('kb-text', `kb_text_${botId}`);
    if (typeof freeText === 'string') kb.freeText = freeText;

    const urls = await load('kb-text', `kb_urls_${botId}`);
    if (Array.isArray(urls)) kb.urls = urls;

    const index = await load('kb-text', `kb_index_${botId}`);
    if (index && index.fileNames) {
      for (const name of index.fileNames) {
        let content = await load('kb-text', `kb_file_${botId}_${name}`);
        if (content == null) {
          content = await load('kb-document', `kb_file_${botId}_${name}`, {
            filename: `${botId}_${name}`
          });
        }
        if (content != null) kb.files.push({ name, content });
      }
    }

    return kb;
  }


  // ═══════════════════════════════════════════════
  // Bot Profile Sync (localStorage ↔ Supabase)
  // ═══════════════════════════════════════════════

  /**
   * 봇 프로필을 Supabase에 동기화
   * MCW.storage.saveBot() 이후 호출
   */
  async function syncBotToCloud(botData) {
    if (!getSupabase()) return null;

    const payload = {
      id: botData.id,
      username: botData.username,
      owner_id: botData.ownerId || 'admin',
      bot_name: botData.botName,
      bot_desc: botData.botDesc || '',
      emoji: botData.emoji || '🤖',
      greeting: botData.greeting || '',
      faqs: botData.faqs || [],
      input_text: botData.inputText || '',
      created_at: botData.createdAt || new Date().toISOString()
    };

    const result = await supabaseSave('mcw_bots', payload);

    // 공개 페르소나(avatar)도 동기화
    const avatarPersonas = (botData.personas || []).filter(p => p.category === 'avatar');
    for (const p of avatarPersonas) {
      await supabaseSave('mcw_personas', {
        id: p.id,
        bot_id: botData.id,
        name: p.name,
        role: p.role,
        category: p.category,
        model: p.model,
        iq_eq: p.iqEq,
        is_public: true,
        greeting: p.greeting,
        faqs: p.faqs
      });
    }

    return result;
  }

  /**
   * Supabase에서 봇 프로필 로드
   */
  async function loadBotFromCloud(botId) {
    if (!getSupabase()) return null;

    const bot = await supabaseGet('mcw_bots', botId);
    if (!bot) return null;

    const personas = await supabaseQuery('mcw_personas', { bot_id: botId });

    return {
      id: bot.id,
      username: bot.username,
      ownerId: bot.owner_id,
      botName: bot.bot_name,
      botDesc: bot.bot_desc,
      emoji: bot.emoji,
      greeting: bot.greeting,
      faqs: bot.faqs,
      personas: personas.map(p => ({
        id: p.id,
        name: p.name,
        role: p.role,
        category: p.category,
        model: p.model,
        iqEq: p.iq_eq,
        isPublic: p.is_public,
        greeting: p.greeting,
        faqs: p.faqs
      })),
      createdAt: bot.created_at
    };
  }


  // ─── Init: 자동 연결 시도 ───
  if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
      const sb = getSupabase();
      if (sb) console.log('[StorageManager] Supabase auto-connected');
      else console.log('[StorageManager] Supabase not available, using local fallback');
      console.log('[StorageManager] Capabilities:', getCapabilities());
    });
  }


  // ─── Public API ───
  return {
    // Core CRUD
    save,
    load,
    remove,
    list,

    // Knowledge Base
    saveKnowledgeBase,
    loadKnowledgeBase,

    // Bot Cloud Sync
    syncBotToCloud,
    loadBotFromCloud,

    // Info / Debug
    route: getRoute,
    getCapabilities,
    getCategoryInfo,
    getSupabase,

    // Direct layer access (advanced)
    indexedDB: { put: idbPut, get: idbGet, getByCategory: idbGetByCategory, delete: idbDelete },
    pcFile: { save: pcFileSave, load: pcFileLoad, delete: pcFileDelete, list: pcFileList, download: downloadFile },
    supabase: {
      save: supabaseSave, get: supabaseGet, query: supabaseQuery, delete: supabaseDelete,
      storage: {
        save: supabaseStorageSave, get: supabaseStorageGet,
        delete: supabaseStorageDelete, url: supabaseStorageUrl, list: supabaseStorageList
      }
    },

    // Constants
    SIZE_THRESHOLD,
    CATEGORIES
  };

})();

window.StorageManager = StorageManager;
