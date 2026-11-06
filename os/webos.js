/* PhiOS Web Alpha R1. An intentionally unprivileged, local-only browser workspace.
   No backend, remote scripts, eval, native OS access, permission bridge or silent sync. */
(() => {
  'use strict';
  const APPS = Object.freeze({
    files:{title:'File Manager',glyph:'▤'},notes:{title:'Notes Editor',glyph:'✎'},
    terminal:{title:'Safe Console',glyph:'⌘'},ledger:{title:'Local Activity Ledger',glyph:'◇'},
    settings:{title:'Settings & Backup',glyph:'⚙'},catalog:{title:'Public App Catalog',glyph:'✦'},appcenter:{title:'Reviewed App Center',glyph:'⬡'},about:{title:'About PhiOS Web',glyph:'Φ'}
  });
  const STORE = 'phi-web-r1';
  const FILE_LIMIT = 50000, FILE_COUNT = 100, IMPORT_LIMIT = 512000, LEDGER_LIMIT = 80;
  const $ = (sel,ctx=document) => ctx.querySelector(sel);
  const windows = new Map();
  const state = {db:null,storage:'starting',docs:[],prefs:{alias:'Field Explorer',effects:true},events:[],
    activeDoc:null,shelf:[],front:10,term:['PhiOS WEB ALPHA 0.1  ·  UNPRIVILEGED CONSOLE','Type help for supported commands. No host shell access.']};
  const randomId = () => globalThis.crypto?.randomUUID?.() ?? 'doc-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
  const initialDoc = () => ({id:randomId(),name:'WELCOME.txt',text:
    'Welcome to PhiOS Web Alpha.\n\nThis is a real browser workspace.\nCreate files and notes, use the safe console, inspect the local activity history, and export your data.\n\nAll content stays in this browser unless you explicitly export it.\nThe browser edition does NOT run the Linux OS, access your PC, run arbitrary commands, or connect to a private PhiOS service.\n\nCapability is not authority.'});
  const cleanName = value => String(value||'').trim().replace(/[\\/<>:"|?*\u0000-\u001f]/g,'_').slice(0,80);
  function notify(message){const e=$('#toast');e.textContent=message;clearTimeout(notify.timer);notify.timer=setTimeout(()=>e.textContent='',4600);}
  function updateBadge(){const badge=$('#storageBadge');const persistent=state.storage==='indexeddb';badge.classList.toggle('session',!persistent);badge.textContent=persistent?'LOCAL STORAGE · READY':'SESSION ONLY · EXPORT DATA';}
  function stamp(){return new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});}
  function updateClock(){$('#clock').textContent=stamp();}
  function eventLog(action){state.events.unshift({at:new Date().toISOString(),action:String(action).slice(0,160)});state.events=state.events.slice(0,LEDGER_LIMIT);}
  function kvOpen(){
    return new Promise((resolve,reject)=>{
      if(!('indexedDB' in window))return reject(Error('IndexedDB unavailable'));
      const req=indexedDB.open(STORE,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('records'))req.result.createObjectStore('records');};
      req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Cannot open IndexedDB'));
      req.onblocked=()=>reject(Error('Storage upgrade blocked'));
    });
  }
  function kvGet(db,key){return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readonly'),req=tx.objectStore('records').get(key);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error||Error('Read failed'));
  });}
  function kvPut(db,key,value){return new Promise((resolve,reject)=>{
    const tx=db.transaction('records','readwrite');tx.objectStore('records').put(value,key);
    tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Write failed'));
  });}
  function backupState(){return {format:'phios-web-alpha',version:1,exportedAt:new Date().toISOString(),
    docs:state.docs.map(({id,name,text})=>({id,name,text})),
    prefs:{alias:state.prefs.alias,effects:state.prefs.effects},
    events:state.events.slice(0,LEDGER_LIMIT)};}
  function persist(){
    if(!state.db)return;
    // Snapshot is written only to this origin's browser database.
    kvPut(state.db,'workspace',backupState()).catch(()=>{
      state.storage='session';state.db=null;updateBadge();notify('Local storage failed. Export data to keep a copy.');
    });
  }
  function validateBackup(input){
    if(!input||typeof input!=='object'||Array.isArray(input)||input.format!=='phios-web-alpha'||input.version!==1)throw Error('Not a PhiOS Web Alpha backup');
    if(!Array.isArray(input.docs)||input.docs.length>FILE_COUNT)throw Error('Invalid file count');
    const ids=new Set(),names=new Set();
    const docs=input.docs.map(d=>{
      if(!d||typeof d!=='object'||typeof d.id!=='string'||d.id.length>110||
         typeof d.name!=='string'||!d.name.trim()||d.name!==cleanName(d.name)||typeof d.text!=='string'||d.text.length>FILE_LIMIT)throw Error('Invalid file');
      if(ids.has(d.id)||names.has(d.name.toLowerCase()))throw Error('Duplicate file');
      ids.add(d.id);names.add(d.name.toLowerCase());return {id:d.id,name:d.name,text:d.text};
    });
    const p=input.prefs;
    if(!p||typeof p!=='object'||typeof p.alias!=='string'||p.alias.length>40||typeof p.effects!=='boolean')throw Error('Invalid settings');
    if(!Array.isArray(input.events)||input.events.length>LEDGER_LIMIT)throw Error('Invalid ledger');
    const events=input.events.map(e=>{
      if(!e||typeof e!=='object'||typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at))||typeof e.action!=='string'||e.action.length>160)throw Error('Invalid ledger entry');
      return {at:e.at,action:e.action};
    });
    return {docs,prefs:{alias:p.alias,effects:p.effects},events};
  }
  function fileById(id){return state.docs.find(d=>d.id===id);}
  function uniqueName(base){
    const seed=cleanName(base)||'Untitled.txt';let name=seed;
    const suffix=seed.match(/(\.[^.]+)$/)?.[1]||'';
    const stem=suffix?seed.slice(0,-suffix.length):seed;
    let i=2;
    const used=n=>state.docs.some(d=>d.name.toLowerCase()===n.toLowerCase());
    while(used(name)){
      const postfix='-'+i++;
      name=stem.slice(0,Math.max(1,80-suffix.length-postfix.length))+postfix+suffix;
    }
    return name;
  }
  function createDoc(name='Untitled.txt',text=''){
    if(state.docs.length>=FILE_COUNT){notify('100-file limit reached. Export or delete first.');return null;}
    const d={id:randomId(),name:uniqueName(name),text};state.docs.push(d);state.activeDoc=d.id;
    eventLog('Created local file: '+d.name);persist();refresh('files');return d;
  }
  function renderApp(app,body){
    body.replaceChildren();
    if(app==='files')return renderFiles(body);
    if(app==='notes')return renderNotes(body);
    if(app==='terminal')return renderTerminal(body);
    if(app==='ledger')return renderLedger(body);
    if(app==='settings')return renderSettings(body);
    if(app==='catalog')return renderCatalog(body);
    if(app==='appcenter')return renderAppCenter(body);
    return renderAbout(body);
  }
  function shell(body,markup){body.innerHTML=markup;}
  function renderFiles(body){
    shell(body,'<div class="toolbar"><button class="btn primary" data-action="new-file">+ NEW TEXT FILE</button><button class="btn" data-action="export">EXPORT BACKUP</button></div><p class="help">Virtual text files are stored on this browser origin only. No access to your real device filesystem.</p><div class="files-list"></div>');
    const list=$('.files-list',body);
    for(const d of state.docs){
      const row=document.createElement('div');row.className='file-row';
      const open=document.createElement('button');open.type='button';open.dataset.action='edit-file';open.dataset.file=d.id;open.textContent='▤  '+d.name;
      const meta=document.createElement('small');meta.textContent=d.text.length+' chars';
      const del=document.createElement('button');del.type='button';del.className='remove';del.dataset.action='delete-file';del.dataset.file=d.id;del.textContent='Delete';del.setAttribute('aria-label','Delete '+d.name);
      row.append(open,meta,del);list.append(row);
    }
  }
  function renderNotes(body){
    const doc=fileById(state.activeDoc)||state.docs[0];
    if(!doc){shell(body,'<p>No notes yet.</p><button class="btn primary" data-action="new-file">CREATE A FILE</button>');return;}
    state.activeDoc=doc.id;
    shell(body,'<div class="toolbar"><span class="muted" id="editName"></span><button class="btn" data-action="new-file">+ NEW</button><button class="btn" data-action="export">BACKUP</button></div><textarea class="editor" id="editor" aria-label="Text file contents" spellcheck="false" maxlength="50000"></textarea><div class="status-message" id="editStatus">Saves automatically to local browser storage.</div>');
    $('#editName',body).textContent='▤  '+doc.name;
    const editor=$('#editor',body);editor.value=doc.text;
    editor.addEventListener('input',()=>{doc.text=editor.value;clearTimeout(renderNotes.saveTimer);renderNotes.saveTimer=setTimeout(()=>{persist();const message=$('#editStatus',body);if(message)message.textContent=state.db?'Saved locally':'Session only: export to preserve changes';},320);});
  }
  function renderTerminal(body){
    shell(body,'<h2>Safe Console</h2><p class="help">A tiny browser command interpreter. Commands are handled as data; they never reach your machine shell.</p><div class="terminal" role="log" aria-label="Console output"></div><label class="cmdline">Φ &gt; <input id="command" maxlength="150" spellcheck="false" autocomplete="off" aria-label="Console command"></label>');
    $('.terminal',body).textContent=state.term.slice(-80).join('\n');
    const input=$('#command',body);input.addEventListener('keydown',ev=>{
      if(ev.key!=='Enter')return;ev.preventDefault();const command=input.value.trim();input.value='';if(command)runCommand(command,body);
    });
  }
  function runCommand(command,body){
    const [cmd,...parts]=command.split(/\s+/),arg=parts.join(' ');
    if(cmd==='clear'){state.term=[];renderTerminal(body);$('#command',body)?.focus();return;}
    let output='';
    switch(cmd.toLowerCase()){
      case 'help':output='help | ls | cat FILE | open APP | date | whoami | status | version | clear';break;
      case 'ls':output=state.docs.map(d=>d.name).join('\n')||'(no local files)';break;
      case 'cat':{const doc=state.docs.find(d=>d.name.toLowerCase()===arg.toLowerCase());output=doc?doc.text.slice(0,2000):'File not found';break;}
      case 'whoami':output=state.prefs.alias+' (local display name; not an authenticated identity)';break;
      case 'date':output=new Date().toString();break;
      case 'version':output='PhiOS Web Alpha 0.1 · browser edition';break;
      case 'status':output='Runtime: browser-only | Storage: '+state.storage+' | Native access: NONE | Remote bridge: NOT CONNECTED';break;
      case 'open':if(APPS[arg.toLowerCase()]){openWindow(arg.toLowerCase());output='Opened '+arg.toLowerCase();}else output='Unknown app';break;
      default:output='Unsupported command. Type help. No host shell or code execution is available.';
    }
    state.term.push('Φ > '+command,output);state.term=state.term.slice(-80);
    const log=$('.terminal',body);if(log){log.textContent=state.term.join('\n');log.scrollTop=log.scrollHeight;}
  }
  function renderLedger(body){
    shell(body,'<h2>Local Activity Ledger</h2><p class="notice">This is a user-controlled local activity history, NOT a cryptographically verified PhiOS Reality Ledger, proof of provenance, or authorization receipt.</p><div class="toolbar"><button class="btn" data-action="export">EXPORT WORKSPACE</button><button class="btn danger" data-action="clear-ledger">CLEAR HISTORY</button></div><ol class="ledger-list"></ol>');
    const list=$('.ledger-list',body);
    for(const e of state.events){const row=document.createElement('li'),time=document.createElement('time'),msg=document.createElement('span');time.textContent=new Date(e.at).toLocaleString();msg.textContent=e.action;row.append(time,msg);list.append(row);}
  }
  function renderSettings(body){
    shell(body,'<h2>Settings & Sovereignty</h2><p class="help">Your files stay under this website\'s browser storage. Clearing site data or private browsing may erase them. Export regularly.</p><label class="label">LOCAL CALLSIGN <input class="field" id="alias" maxlength="40" autocomplete="off"></label><div class="setting"><input type="checkbox" id="effects"><label for="effects">Enable cosmetic space effects</label></div><div class="toolbar"><button class="btn primary" data-action="save-prefs">SAVE PREFERENCES</button></div><h3>Data portability</h3><div class="toolbar"><button class="btn" data-action="export">EXPORT JSON</button><button class="btn" data-action="import">IMPORT JSON</button><button class="btn danger" data-action="wipe">RESET LOCAL WORKSPACE</button></div><p class="notice">Imports replace this browser workspace only after confirmation. Exported JSON is unencrypted and may contain private notes. No account or cross-site syncing exists.</p><p class="status-message">Storage: <span id="storageState"></span></p>');
    $('#alias',body).value=state.prefs.alias;$('#effects',body).checked=state.prefs.effects;
    $('#storageState',body).textContent=state.storage==='indexeddb'?'IndexedDB on this browser origin':'Session only (storage unavailable)';
  }
  function publicCatalog(){
    const catalog=window.PHI_PUBLIC_CATALOG;
    if(!catalog||catalog.schema!=='phios.public-repo-catalog.v1'||
       catalog?.provenance?.scope!=='public'||catalog?.provenance?.complete!==true||
       catalog?.policy?.automatic_install!==false||catalog?.policy?.automatic_launch!==false||
       catalog?.policy?.review_required!==true||!Array.isArray(catalog.apps))return null;
    const seen=new Set();
    const apps=[];
    for(const app of catalog.apps){
      if(!app||typeof app.name!=='string'||!/^[A-Za-z0-9_.-]{1,100}$/.test(app.name)||
         typeof app.id!=='string'||!/^github:[0-9]{1,20}$/.test(app.id)||
         app.availability!=='source_only'||seen.has(app.id)||
         app.repository!=='https://github.com/MichaelWave369/'+app.name) return null;
      seen.add(app.id);
      apps.push(app);
    }
    return {apps,snapshot:catalog.provenance.snapshot_fetched_at};
  }
  // App Shelf pins public source identities only. Never launch/install from a pin.
  const shelfCatalog=()=>window.PHI_PUBLIC_CATALOG;
  const shelfApi=()=>globalThis.PhiShelf;
  function renderShelf(){
    const target=$('#shelf-list'),status=$('#shelf-status');
    if(!target||!status)return;
    target.replaceChildren();
    const api=shelfApi(),catalog=shelfCatalog(),data=publicCatalog();
    if(!api||!data){status.textContent='Public source catalog unavailable. Shelf controls are disabled.';return;}
    const map=new Map(data.apps.map(item=>[item.id,item]));
    status.textContent=state.shelf.length+' / '+api.LIMIT+' source bookmarks · '+(state.db?'saved in this browser':'session only; export to keep')+' · no installs';
    for(const [index,id] of state.shelf.entries()){
      const entry=map.get(id);
      if(!entry)continue;
      const row=document.createElement('div');row.className='shelf-entry';row.setAttribute('role','listitem');
      const details=document.createElement('div');details.className='shelf-details';
      const name=document.createElement('strong');name.textContent=entry.name;
      const label=document.createElement('small');label.textContent=api.badge(entry);
      const link=document.createElement('a');link.href=entry.repository;link.target='_blank';link.rel='noopener noreferrer';link.textContent='VIEW SOURCE ↗';link.setAttribute('aria-label','View '+entry.name+' source');
      details.append(name,label,link);
      const controls=document.createElement('div');controls.className='shelf-controls';
      for(const [action,text,disabled] of [['up','↑',index===0],['down','↓',index===state.shelf.length-1],['unpin','×',false]]){
        const button=document.createElement('button');button.type='button';button.dataset.shelfAction=action;
        button.dataset.sourceId=id;button.textContent=text;button.disabled=disabled;
        button.setAttribute('aria-label',(action==='up'?'Move ':action==='down'?'Move ':'Unpin ')+entry.name+
          (action==='up'?' up':action==='down'?' down':''));
        controls.append(button);
      }
      row.append(details,controls);target.append(row);
    }
    if(!state.shelf.length){
      const empty=document.createElement('p');empty.className='muted';empty.textContent='Nothing pinned yet. Open App Catalog and pin a public source.';
      target.append(empty);
    }
  }
  function refreshCatalogPins(){
    document.querySelectorAll('.catalog-entry [data-shelf-action]').forEach(button=>{
      const on=state.shelf.includes(button.dataset.sourceId);
      button.dataset.shelfAction=on?'unpin':'pin';
      button.textContent=on?'UNPIN':'PIN SOURCE';
      button.setAttribute('aria-pressed',String(on));
    });
  }
  function applyShelf(next){
    const api=shelfApi(),catalog=shelfCatalog();
    state.shelf=api.normalize(next,catalog);
    renderShelf();refreshCatalogPins();
    if(state.db){
      api.packet(state.shelf,catalog);
      kvPut(state.db,'app-shelf-r2',api.packet(state.shelf,catalog)).catch(()=>{
        state.db=null;state.storage='session';updateBadge();renderShelf();
        notify('Shelf storage failed; export shelf to keep bookmarks.');
      });
    }
  }
  function exportShelf(){
    const api=shelfApi(),catalog=shelfCatalog();
    try{
      const payload=JSON.stringify(api.packet(state.shelf,catalog),null,2);
      const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download='phios-app-shelf-r2.json';
      document.body.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      notify('Portable source-only shelf exported. JSON is readable.');
    }catch(e){notify('Export unavailable: '+e.message);}
  }
  async function importShelf(file){
    if(!file)return;
    const api=shelfApi(),catalog=shelfCatalog();
    if(!api||!catalog){notify('Catalog unavailable. Import refused.');return;}
    if(file.size>api.MAX_BYTES){notify('Shelf import exceeds 16 KiB.');return;}
    try{
      const incoming=api.parse(await file.text(),catalog);
      if(!window.confirm('Replace only the '+state.shelf.length+' pinned source bookmarks with '+incoming.length+' imported pins? Notes and settings will stay.'))return;
      applyShelf(incoming);notify('Source bookmarks imported. No software installed.');
    }catch(e){notify('Shelf import refused: '+e.message);}
  }
  async function restoreShelf(){
    const api=shelfApi(),catalog=shelfCatalog();
    if(!api||!catalog){renderShelf();return;}
    if(state.db){
      try{
        const saved=await kvGet(state.db,'app-shelf-r2');
        if(saved)state.shelf=api.parse(JSON.stringify(saved),catalog);
      }catch(e){state.shelf=[];notify('Stored shelf invalid. Export existing files separately; no shelf was imported.');}
    }
    renderShelf();
  }
  function renderCatalog(body){
    const data=publicCatalog();
    if(!data){shell(body,'<h2>Public App Catalog</h2><p class="notice">Pinned catalog unavailable or invalid. No app installation or execution is permitted.</p>');return;}
    shell(body,'<h2>Public App Catalog</h2><p class="notice">DISCOVERY ONLY. These public GitHub sources are not verified apps. VIEW SOURCE opens GitHub in a new tab; no software is installed, imported or executed.</p><div class="toolbar"><label class="label">SEARCH PUBLIC REPOSITORIES <input class="field" id="catalog-search" type="search" autocomplete="off" placeholder="Find a project"></label></div><p class="catalog-meta" id="catalog-meta" role="status" aria-live="polite"></p><div class="catalog-items" id="catalog-items"></div><button class="btn" id="catalog-more" type="button" hidden>SHOW MORE PROJECTS</button>');
    const input=$('#catalog-search',body),items=$('#catalog-items',body),
          meta=$('#catalog-meta',body),more=$('#catalog-more',body);
    let matches=data.apps,shown=0;
    const append=()=>{
      const batch=matches.slice(shown,shown+35);
      for(const entry of batch){
        const row=document.createElement('article');row.className='catalog-entry';
        const info=document.createElement('div');info.className='catalog-info';
        const title=document.createElement('strong');title.textContent=entry.name;
        const desc=document.createElement('p');desc.textContent=entry.description||'No description provided.';
        const label=document.createElement('small');label.textContent=(entry.language||'Unknown language')+' · '+shelfApi().badge(entry)+(entry.archived?' · ARCHIVED':'');
        const link=document.createElement('a');link.className='btn';link.target='_blank';link.rel='noopener noreferrer';link.href=entry.repository;link.textContent='VIEW SOURCE ↗';link.setAttribute('aria-label','View '+entry.name+' public GitHub source in a new tab');
        const actions=document.createElement('div');actions.className='catalog-actions';
        const pin=document.createElement('button');pin.type='button';pin.className='btn';pin.dataset.sourceId=entry.id;
        const selected=state.shelf.includes(entry.id);pin.dataset.shelfAction=selected?'unpin':'pin';pin.textContent=selected?'UNPIN':'PIN SOURCE';
        pin.setAttribute('aria-pressed',String(selected));pin.setAttribute('aria-label',(selected?'Unpin ':'Pin ')+entry.name);
        actions.append(pin,link);
        info.append(title,desc,label);row.append(info,actions);items.append(row);
      }
      shown+=batch.length;
      more.hidden=shown>=matches.length;
      meta.textContent=matches.length+' / '+data.apps.length+' public repositories · snapshot '+data.snapshot+' · '+shown+' displayed';
    };
    more.addEventListener('click',append);
    input.addEventListener('input',()=>{
      const needle=input.value.trim().toLowerCase().slice(0,100);
      matches=data.apps.filter(app=>app.name.toLowerCase().includes(needle)||
        (app.description||'').toLowerCase().includes(needle));
      shown=0;items.replaceChildren();append();
    });
    append();
  }
  // R4: this first-party candidate was reviewed in a static Chromium CI bundle.
  // Neither review metadata nor a repository listing grants program execution.
  let browserInstallPrompt=null;
  let browserInstalledReported=false;
  function reviewedWebProfile(){
    const reviews=window.PHI_REVIEWED_APPS,catalog=window.PHI_PUBLIC_CATALOG;
    if(!reviews||reviews.schema!=='phios.app-center-reviews.v1'||
      reviews.catalog_source_sha!==catalog?.provenance?.source_blob_sha||
      reviews.policy?.source_listing_is_not_installation!==true||
      reviews.policy?.autonomous_installs!==false||reviews.policy?.native_install_grants!==false||
      reviews.policy?.user_gesture_required!==true||reviews.policy?.browser_controls_pwa_install!==true||
      !Array.isArray(reviews.reviewed_web_apps)||reviews.reviewed_web_apps.length!==1)return null;
    const app=reviews.reviewed_web_apps[0];
    const source=catalog.apps?.find(x=>x.id==='github:1442243366');
    if(!source||source.name!=='phi-field'||
      source.repository!=='https://github.com/MichaelWave369/phi-field'||
      app?.app_id!==source.id||app.name!=='PhiOS Web'||app.repository!==source.repository||
      app.runtime!=='browser_pwa'||app.review_status!=='ci_reviewed_browser_app'||
      app.launch_url!=='https://phi-field.com/os/'||app.scope_path!=='/os/'||
      app.evidence?.repository!=='MichaelWave369/phi-field'||
      app.evidence?.test_path!=='tests/browser_web_os.py'||app.evidence?.source_pr!==8||
      app.evidence?.evidence_scope!=='static_build_and_chromium_ci'||
      app.evidence?.live_endpoint_independently_verified!==false||
      app.actions?.open!=='explicit_navigation'||
      app.actions?.install!=='browser_mediated_if_available'||
      app.actions?.native_install!==false||app.actions?.automatic_execution!==false)return null;
    return app;
  }
  function renderAppCenter(body){
    const profile=reviewedWebProfile();
    if(!profile){
      shell(body,'<h2>Reviewed App Center</h2><p class="notice">The reviewed-app registry is unavailable or invalid. No installs or app launches were authorized.</p>');
      return;
    }
    shell(body,'<h2>⬡ Reviewed App Center</h2><p class="help">First qualified rung: a genuine browser PWA candidate with passing source/Chromium CI. This is not a license to install GitHub repositories or run native operating-system commands.</p><div class="reviewed-app"></div><h3>Other projects</h3><p class="muted">The remaining 224 public sources are discoverable in App Catalog, but not independently qualified for install or launch.</p><button type="button" class="btn" data-open="catalog">BROWSE SOURCE CATALOG</button>');
    const card=$('.reviewed-app',body);
    const heading=document.createElement('h3');heading.textContent=profile.name;
    const badge=document.createElement('small');badge.textContent='CI-REVIEWED WEB PWA · PRODUCTION ENDPOINT NOT INDEPENDENTLY VERIFIED';
    const desc=document.createElement('p');desc.textContent=profile.disclosure;
    const note=document.createElement('p');note.className='help';
    note.textContent='Evidence: '+profile.evidence.repository+' PR #'+profile.evidence.source_pr+' Chromium acceptance. PWA installability depends on this browser.';
    const row=document.createElement('div');row.className='toolbar';
    const open=document.createElement('a');open.className='btn primary';open.href='./';open.target='_blank';open.rel='noopener noreferrer';open.textContent='OPEN PHIOS WEB ↗';open.setAttribute('aria-label','Open PhiOS Web in a new browser tab');
    const source=document.createElement('a');source.className='btn';source.href=profile.repository;source.target='_blank';source.rel='noopener noreferrer';source.textContent='VIEW REVIEWED SOURCE ↗';
    const install=document.createElement('button');install.className='btn';install.type='button';install.dataset.action='pwa-install';
    install.textContent=browserInstalledReported?'INSTALLED (BROWSER REPORTED)':browserInstallPrompt?'INSTALL WITH BROWSER':'INSTALL IN BROWSER MENU';
    if(browserInstalledReported)install.disabled=true;
    const message=document.createElement('p');message.id='install-help';message.className='status-message';message.setAttribute('role','status');
    message.textContent=browserInstalledReported?'The browser reported successful PWA installation.':
      browserInstallPrompt?'The browser offers an installation prompt. Installation still requires your approval.':
      'Use the browser menu or address-bar Install option when available. Some browsers do not provide a custom installation prompt.';
    row.append(open,install,source);card.append(heading,badge,desc,note,row,message);
  }
  function installBrowserApp(){
    const profile=reviewedWebProfile();
    if(!profile)return;
    if(!browserInstallPrompt){
      const help=$('#install-help');
      if(help)help.textContent='No browser-managed prompt is available. Check your browser menu for Install app or Add to Home Screen. Nothing was installed.';
      return;
    }
    const pending=browserInstallPrompt;browserInstallPrompt=null;
    // prompt() is invoked synchronously from the user's button click.
    try{
      Promise.resolve(pending.prompt()).then(result=>{
        const help=$('#install-help');
        if(help)help.textContent=result?.outcome==='accepted'
          ?'Browser accepted the installation request. Confirm installation through the browser.'
          :'Installation was dismissed or not completed by the browser.';
        refresh('appcenter');
      }).catch(()=>{notify('Browser installation prompt unavailable. Use browser menu.');refresh('appcenter');});
    }catch{notify('Browser installation prompt could not open. Use browser menu.');refresh('appcenter');}
  }
  function installEvents(){
    window.addEventListener('beforeinstallprompt',event=>{
      if(!reviewedWebProfile())return;
      event.preventDefault();
      browserInstallPrompt=event;
      refresh('appcenter');
    });
    window.addEventListener('appinstalled',()=>{
      browserInstallPrompt=null;
      browserInstalledReported=true;
      refresh('appcenter');
    });
  }
  function renderAbout(body){
    shell(body,'<h2>Φ PhiOS Web Alpha 0.1</h2><p>A genuine unprivileged browser workspace built as the first PhiOS web rung.</p><div class="checks"><div class="check"><b>WORKING NOW</b>Files, notes, window management, local IndexedDB, portable JSON, safe commands, offline app shell.</div><div class="check"><b>NOT PRESENT</b>Linux boot, PC filesystem, native installs, local models, agent execution, remote bridge.</div><div class="check"><b>LOCAL AUTHORITY</b>Only explicit user interactions inside this webpage. No background agent or privileged operation.</div><div class="check"><b>OPEN DEVELOPMENT</b>Alpha software. Local history does not qualify as independent audit evidence.</div></div><p class="notice">Capability ≠ Authority. A working interface does not grant access to your computer or your private PhiOS runtime.</p><div class="toolbar"><a class="btn" href="https://github.com/MichaelWave369/PhiOS" target="_blank" rel="noopener noreferrer">PHIOS SOURCE ↗</a><a class="btn" href="../">RETURN TO GATEWAY ↗</a></div>');
  }
  function refresh(app){const win=windows.get(app);if(win)renderApp(app,$('.window-body',win));}
  function drawDock(){const dock=$('#dock');dock.replaceChildren();for(const [id,win] of windows){
    const btn=document.createElement('button');btn.type='button';btn.textContent=APPS[id].glyph+' '+APPS[id].title;btn.dataset.open=id;btn.classList.toggle('active',!win.hidden);dock.append(btn);
  }}
  function focusWindow(win){state.front++;win.style.zIndex=String(state.front);if(win.hidden)win.hidden=false;drawDock();}
  function openWindow(app){
    if(!APPS[app])return;let win=windows.get(app);
    if(win){focusWindow(win);return;}
    win=document.createElement('section');win.className='window';win.dataset.app=app;win.setAttribute('role','dialog');win.setAttribute('aria-label',APPS[app].title);
    const offset=windows.size%5;win.style.setProperty('--x',Math.min(20,8+offset*3)+'%');win.style.setProperty('--y',Math.min(18,7+offset*2)+'%');
    win.innerHTML='<div class="windowbar"><small>Φ</small><strong></strong><button type="button" class="win-control" data-control="min" aria-label="Minimize window">−</button><button type="button" class="win-control" data-control="max" aria-label="Maximize window">□</button><button type="button" class="win-control" data-control="close" aria-label="Close window">×</button></div><div class="window-body"></div>';
    $('.windowbar strong',win).textContent=APPS[app].title;windows.set(app,win);$('#windows').append(win);focusWindow(win);
    renderApp(app,$('.window-body',win));eventLog('Opened '+APPS[app].title);persist();
  }
  function closeMenu(){$('#menu').hidden=true;$('#appMenu').setAttribute('aria-expanded','false');}
  function bindDrag(){
    let drag=null;
    document.addEventListener('pointerdown',ev=>{
      const bar=ev.target.closest('.windowbar');if(!bar||ev.target.closest('button'))return;
      const win=bar.closest('.window');if(win.classList.contains('maximized'))return;
      focusWindow(win);const rect=win.getBoundingClientRect();
      drag={bar,win,id:ev.pointerId,x:ev.clientX-rect.left,y:ev.clientY-rect.top};
      bar.setPointerCapture(ev.pointerId);
    });
    document.addEventListener('pointermove',ev=>{
      if(!drag||drag.id!==ev.pointerId)return;
      const parent=$('#desktop').getBoundingClientRect(),width=drag.win.getBoundingClientRect().width;
      drag.win.style.left=Math.max(0,Math.min(parent.width-width,ev.clientX-parent.left-drag.x))+'px';
      drag.win.style.top=Math.max(0,Math.min(parent.height-68,ev.clientY-parent.top-drag.y))+'px';
    });
    const stop=ev=>{if(drag&&drag.id===ev.pointerId)drag=null;};
    document.addEventListener('pointerup',stop);document.addEventListener('pointercancel',stop);
  }
  async function exportData(){
    const blob=new Blob([JSON.stringify(backupState(),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='phios-web-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    eventLog('Exported workspace backup');persist();notify('Backup exported as plaintext JSON. Store it safely.');
  }
  async function importData(file){
    if(!file)return;
    if(file.size>IMPORT_LIMIT){notify('Import rejected: 512 KB limit');return;}
    let data;
    try{data=validateBackup(JSON.parse(await file.text()));}catch(e){notify('Import rejected: '+e.message);return;}
    if(!window.confirm('Replace this browser workspace with '+data.docs.length+' imported files? Export first if needed.'))return;
    state.docs=data.docs;state.prefs=data.prefs;state.events=data.events;state.activeDoc=state.docs[0]?.id??null;
    eventLog('Imported user-selected workspace');persist();applyEffects();for(const key of windows.keys())refresh(key);notify('Workspace imported locally.');
  }
  function applyEffects(){document.body.dataset.noEffects=String(!state.prefs.effects);}
  function actions(){
    document.addEventListener('click',ev=>{
      const shelf=ev.target.closest('[data-shelf-action]');
      if(shelf){
        const action=shelf.dataset.shelfAction,id=shelf.dataset.sourceId,api=shelfApi(),catalog=shelfCatalog();
        if(!api||!catalog){notify('Catalog unavailable; shelf unchanged.');return;}
        if(action==='export'){exportShelf();return;}
        if(action==='import'){$('#shelfImportFile').click();return;}
        try{
          if(action==='pin')applyShelf(api.pin(state.shelf,id,catalog));
          if(action==='unpin')applyShelf(api.unpin(state.shelf,id,catalog));
          if(action==='up'||action==='down')applyShelf(api.move(state.shelf,id,action==='up'?-1:1,catalog));
        }catch(e){notify(e.message);}
        return;
      }
      const open=ev.target.closest('[data-open]');if(open){openWindow(open.dataset.open);closeMenu();return;}
      const control=ev.target.closest('[data-control]');if(control){
        const win=control.closest('.window'),id=win?.dataset.app;if(!win)return;
        const action=control.dataset.control;
        if(action==='close'){win.remove();windows.delete(id);drawDock();}
        else if(action==='min'){win.hidden=true;drawDock();}
        else if(action==='max'){win.classList.toggle('maximized');focusWindow(win);}
        return;
      }
      const action=ev.target.closest('[data-action]');if(!action)return;
      const key=action.dataset.action;
      if(key==='pwa-install'){installBrowserApp();return;}
      if(key==='new-file'){
        const value=window.prompt('New text file name (up to 80 characters)','Untitled.txt');
        if(value!==null){const d=createDoc(value);if(d)openWindow('notes'),refresh('notes');}
      }else if(key==='edit-file'){state.activeDoc=action.dataset.file;openWindow('notes');refresh('notes');}
      else if(key==='delete-file'){
        const doc=fileById(action.dataset.file);
        if(doc&&window.confirm('Delete local file "'+doc.name+'"? This cannot be undone.')){
          state.docs=state.docs.filter(d=>d.id!==doc.id);if(state.activeDoc===doc.id)state.activeDoc=state.docs[0]?.id??null;
          eventLog('Deleted local file: '+doc.name);persist();refresh('files');refresh('notes');
        }
      }else if(key==='save-prefs'){
        const panel=action.closest('.window-body'),alias=$('#alias',panel).value.trim();
        state.prefs={alias:alias.slice(0,40)||'Field Explorer',effects:$('#effects',panel).checked};
        applyEffects();eventLog('Changed local preferences');persist();notify('Local preferences saved.');
      }else if(key==='export'){exportData();}
      else if(key==='import'){$('#importFile').click();}
      else if(key==='clear-ledger'){
        if(window.confirm('Clear this local unverified activity history?')){state.events=[];persist();refresh('ledger');}
      }else if(key==='wipe'){
        if(window.confirm('Erase all files, notes, preferences and history on THIS browser origin? Export first.')){
          state.docs=[initialDoc()];state.activeDoc=state.docs[0].id;state.prefs={alias:'Field Explorer',effects:true};state.events=[];
          eventLog('Reset local workspace');applyEffects();persist();for(const app of windows.keys())refresh(app);notify('Local workspace reset.');
        }
      }
    });
    const menu=$('#menu'),button=$('#appMenu');
    button.addEventListener('click',()=>{menu.hidden=!menu.hidden;button.setAttribute('aria-expanded',String(!menu.hidden));});
    document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){closeMenu();const front=[...windows.values()].filter(w=>!w.hidden).sort((a,b)=>(+b.style.zIndex)-(+a.style.zIndex))[0];if(front)front.hidden=true,drawDock();}});
    $('#importFile').addEventListener('change',async ev=>{await importData(ev.target.files?.[0]);ev.target.value='';});
    $('#shelfImportFile').addEventListener('change',async ev=>{await importShelf(ev.target.files?.[0]);ev.target.value='';});
    bindDrag();
  }
  async function boot(){
    actions();installEvents();updateClock();setInterval(updateClock,60000);
    try{
      state.db=await kvOpen();state.storage='indexeddb';
      const saved=await kvGet(state.db,'workspace');
      if(saved){const safe=validateBackup(saved);state.docs=safe.docs;state.prefs=safe.prefs;state.events=safe.events;}
      else{state.docs=[initialDoc()];state.activeDoc=state.docs[0].id;}
    }catch(error){
      state.storage='session';state.db=null;state.docs=[initialDoc()];notify('Browser storage is unavailable. Use Export to save your work.');
    }
    if(!state.docs.length)state.docs=[initialDoc()];
    state.activeDoc=state.docs[0].id;
    applyEffects();updateBadge();await restoreShelf();eventLog('Browser session started: no native permissions');persist();
    if('serviceWorker' in navigator && location.protocol==='https:'){
      navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{/* Optional offline shell registration */});
    }
    openWindow('about');
  }
  boot();
})();