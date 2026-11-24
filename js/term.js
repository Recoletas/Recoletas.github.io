(function(){
  var S=window.__SITE__||{posts:[]},box=document.querySelector('.shell');if(!box)return;
  var out=box.querySelector('.term-out'),inp=box.querySelector('.term-in'),ps1=box.querySelector('.ps1');
  var user=(S.author||'guest').toLowerCase(),cwd='~',hist=[],hi=0,booted=false;
  try{hist=JSON.parse(localStorage.getItem('hist')||'[]')}catch(e){}
  var tags={};S.posts.forEach(function(p){p.g.forEach(function(g){(tags[g]=tags[g]||[]).push(p)})});

  // 虚拟文件系统
  var FS={'~':{posts:'d',tags:'d','about.txt':'f','quotes.txt':'f','.moon':'f','.ozymandias':'f','.godot':'f','.windmill':'f'},
          '~/posts':{},'~/tags':{}};
  S.posts.forEach(function(p){FS['~/posts'][p.s+'.md']='f'});
  Object.keys(tags).forEach(function(t){FS['~/tags'][t]='d';FS['~/tags/'+t]={};tags[t].forEach(function(p){FS['~/tags/'+t][p.s+'.md']='f'})});

  function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  function print(h,cls){var d=document.createElement('div');if(cls)d.className=cls;d.innerHTML=h;out.appendChild(d);out.scrollTop=out.scrollHeight}
  function line(s,cls){print(esc(s),cls)}
  function prompt(){ps1.textContent=(innerWidth<520?cwd:user+'@glory-ruin:'+cwd)+' $'}
  function resolve(a){
    if(!a||a==='~')return '~';
    var parts=(a[0]==='~'?a:(a[0]==='/'?'~'+a:cwd+'/'+a)).split('/'),st=[];
    parts.forEach(function(x){if(!x||x==='.')return;if(x==='..'){if(st.length>1)st.pop();return}st.push(x)});
    return st.join('/')||'~';
  }
  function kind(path){if(FS[path])return 'd';var i=path.lastIndexOf('/'),dir=FS[path.slice(0,i)];return dir&&dir[path.slice(i+1)]==='f'?'f':null}
  function postOf(path){var m=path.match(/([^\/]+)\.md$/);if(!m)return null;return S.posts.filter(function(p){return p.s===m[1]})[0]}
  function findPost(a){if(!a)return null;var p=postOf(resolve(a.replace(/(\.md)?$/,'.md')));if(p)return p;
    return S.posts.filter(function(p){return p.s===a||p.t===a||p.s+'.md'===a})[0]||null}

  var SPECIAL={
    'about.txt':function(){return [S.title+' — a small ruin built out of words.','by '+S.author+'. poems, prose, and some code.','github  https://github.com/'+S.github]},
    'quotes.txt':function(){return (S.quotes||[]).map(function(q){return q[0]+'  — '+q[1]})},
    '.moon':function(){return ['床前明月光，疑是地上霜。','举头望明月，低头思故乡。','                    — 李白']},
    '.ozymandias':function(){return ['I met a traveller from an antique land ...','“My name is Ozymandias, King of Kings;','Look on my Works, ye Mighty, and despair!”','Nothing beside remains. Round the decay','Of that colossal Wreck, boundless and bare','The lone and level sands stretch far away.',]},
    '.godot':function(){return ['[ A country road. A tree. Evening. ]','ESTRAGON:  Let\'s go.','VLADIMIR:  We can\'t.','ESTRAGON:  Why not?','VLADIMIR:  We\'re waiting for Godot.']},
    '.windmill':function(){return ['Those are not windmills, Sancho. They are giants.']}
  };

  var C={
    help:function(){return ['  ls [-a] [dir]       list files','  cd <dir>            change directory','  cat <file>          read a file or post summary','  open <post>         open a post','  grep <word>         search all posts','  github              public repositories','  fortune             a random line','  theme [dark|light]  jitter [on|off]','  tree pwd clear history date whoami echo']},
    ls:function(a){var all=a.indexOf('-a')>=0||a.indexOf('-la')>=0,t=a.filter(function(x){return x[0]!=='-'})[0],p=resolve(t||'.');
      if(!FS[p]){if(kind(p)==='f')return [t];return {err:'ls: cannot access \''+t+'\': No such file or directory'}}
      var ks=Object.keys(FS[p]).filter(function(k){return all||k[0]!=='.'}).sort();if(all)ks=['.','..'].concat(ks);
      return {html:ks.map(function(k){return FS[p][k]==='d'?'<span class="g">'+esc(k)+'/</span>':esc(k)}).join('   ')}},
    cd:function(a){var p=resolve(a[0]||'~');if(!FS[p])return {err:'cd: '+(a[0]||'')+': Not a directory'};cwd=p;prompt()},
    pwd:function(){return ['/home/'+user+cwd.slice(1)]},
    cat:function(a){if(!a[0])return {err:'cat: missing operand'};
      return [].concat.apply([],a.map(function(f){var base=f.split('/').pop();
        if(SPECIAL[base]&&kind(resolve(f))==='f')return SPECIAL[base]();
        var p=findPost(f);if(p)return {html:'<span class="g"># '+esc(p.t)+'</span>  <span class="d">'+p.d+' '+p.g.map(function(g){return '#'+esc(g)}).join(' ')+'</span>\n'+esc(p.x)+'…\n<a href="'+p.p+'">→ open '+esc(p.s)+'</a>'};
        if(FS[resolve(f)])return {err:'cat: '+f+': Is a directory'};
        return {err:'cat: '+f+': No such file or directory'}}))},
    open:function(a){var p=findPost(a[0]);if(!p)return {err:'open: no such post \''+(a[0]||'')+'\''};setTimeout(function(){location.href=p.p},350)},
    grep:function(a){var w=a.filter(function(x){return x[0]!=='-'}).join(' ');if(!w)return {err:'usage: grep <word>'};
      var r=S.posts.filter(function(p){return (p.t+p.x).toLowerCase().indexOf(w.toLowerCase())>=0});
      if(!r.length)return {err:'(no match)'};
      return {html:r.map(function(p){var i=p.x.toLowerCase().indexOf(w.toLowerCase()),ctx=i<0?'':p.x.slice(Math.max(0,i-14),i+w.length+14);
        return '<a href="'+p.p+'">'+esc(p.s)+'.md</a>: '+esc(ctx).replace(esc(w),'<span class="g">'+esc(w)+'</span>')}).join('\n')}},
    tree:function(){var r=['~'];Object.keys(FS['~']).filter(function(k){return k[0]!=='.'}).forEach(function(k,i,arr){var last=i===arr.length-1;r.push((last?'└── ':'├── ')+k);
      if(FS['~/'+k])Object.keys(FS['~/'+k]).forEach(function(c,j,ar){r.push((last?'    ':'│   ')+(j===ar.length-1?'└── ':'├── ')+c)})});return r},
    clear:function(){out.innerHTML=''},
    history:function(){return hist.map(function(h,i){return String(i+1).padStart(4)+'  '+h})},
    date:function(){return [new Date().toString()]},
    whoami:function(){return [user]},
    echo:function(a){return [a.join(' ')]},
    fortune:function(){var q=S.quotes[Math.floor(Math.random()*S.quotes.length)];return {html:'<span class="i">'+esc(q[0])+'</span>\n<span class="d">        — '+esc(q[1])+'</span>'}},
    quote:function(){if(window.showQuote){showQuote(Date.now()%S.quotes.length);return ['ok.']}return {err:'quote: only on the index page'}},
    theme:function(a){var t=a[0]||(document.documentElement.dataset.theme==='light'?'dark':'light');if(!/^(dark|light)$/.test(t))return {err:'theme: dark | light'};setTheme(t);return []},
    jitter:function(a){var off=a[0]==='off';document.documentElement.dataset.jitter=off?'off':'';try{localStorage.setItem('jitter',off?'off':'on')}catch(e){};return []},
    dust:function(){if(window.scatterDust){scatterDust();return []}return {err:'dust: only on the index page'}},
    exit:function(){C.clear();inp.blur()},
    github:function(){var u=S.github;if(!u)return {err:'github: not configured'};
      line('fetching github.com/'+u+' ...','d');
      fetch('https://api.github.com/users/'+u+'/repos?sort=pushed&per_page=12').then(function(r){if(!r.ok)throw r.status;return r.json()}).then(function(rs){
        out.lastChild.remove();
        print(rs.map(function(r){return '<a href="'+esc(r.html_url)+'" target="_blank" rel="noopener">'+esc(r.name)+'</a>'+(r.language?'  <span class="d">'+esc(r.language)+'</span>':'')+(r.stargazers_count?'  <span class="g">★'+r.stargazers_count+'</span>':'')+(r.description?'\n  <span class="d">'+esc(r.description)+'</span>':'')}).join('\n')||'(no public repositories)');
      }).catch(function(e){out.lastChild.remove();print('<span class="e">github: request failed ('+esc(e)+')</span>  <a href="https://github.com/'+esc(u)+'" target="_blank" rel="noopener">github.com/'+esc(u)+'</a>')})},
    git:function(a){return a[0]==='log'?S.posts.slice(0,8).map(function(p){return {html:'<span class="g">'+p.d+'</span>  '+esc(p.t)}}):C.github()},
    sudo:function(a){return a.join(' ')==='make me a sandwich'?['okay.']:{err:user+' is not in the sudoers file. This incident will be reported.'}},
    rm:function(a){if(a.join(' ').indexOf('-rf')>=0){window.scatterDust&&scatterDust();return {html:'<span class="i">Nothing beside remains.</span>'}}return {err:'rm: Read-only file system'}},
    make:function(a){return a[0]==='love'?{err:'make: *** No rule to make target \'love\'.  Stop.'}:{err:'make: *** No targets specified and no makefile found.  Stop.'}},
    vim:function(a){if(a[0])return C.open(a);return ['~','~','~                VIM - Vi IMproved','~','~']},
    ':q':function(){inp.blur()},':wq':function(){inp.blur()},':q!':function(){inp.blur()},
    emacs:function(){return ['a great operating system, lacking only a decent editor.']},
    ping:function(a){return ['PING '+(a[0]||'moon')+': 64 bytes, time=1.3s','1 packets transmitted, 0 received']},
    godot:function(){line('waiting','d');var n=0,iv=setInterval(function(){out.lastChild.textContent+=' .';if(++n>=5){clearInterval(iv);line('BOY: Mr. Godot told me to tell you he won\'t come this evening but surely tomorrow.','i')}},600)},
    charge:function(){return {html:'you charge the windmill. the windmill wins.\n<span class="i">Rashness is closer to courage than cowardice is.</span>'}},
    quixote:function(){return C.charge()},
    faust:function(){return {html:'<span class="i">Verweile doch! du bist so schön!</span>'}},
    verweile:function(){return C.faust()},
    rose:function(){return {html:'<span class="i">a rose is a rose is a rose is a rose</span>\n<span class="d">            — Gertrude Stein</span>'}},
    hello:function(){return ['hello, world']},
    '42':function(){return ['but what is the question?']},
    man:function(a){return a[0]==='life'?{err:'No manual entry for life'}:{err:'No manual entry for '+(a[0]||'')}},
    cowsay:function(a){var s=a.join(' ')||'grün des Lebens goldner Baum';return [' '+'_'.repeat(s.length+2),'< '+s+' >',' '+'-'.repeat(s.length+2),'        \\   ^__^','         \\  (oo)\\_______','            (__)\\       )\\/\\','                ||----w |','                ||     ||']},
    poem:function(){return C.fortune()},
    ls_:0
  };
  delete C.ls_;
  var CMDS=['help','github','git','ls','cd','pwd','cat','open','less','grep','tree','clear','history','date','whoami','echo','fortune','quote','theme','jitter','dust','exit'];
  C.less=C.open;

  function run(raw){
    var s=raw.trim();print('<span class="ps1">'+esc(ps1.textContent)+'</span> '+esc(raw));if(!s)return;
    hist.push(s);hist=hist.slice(-100);hi=hist.length;try{localStorage.setItem('hist',JSON.stringify(hist))}catch(e){}
    s.split(/\s*(?:&&|;)\s*/).forEach(function(seg){
      var a=seg.match(/"[^"]*"|'[^']*'|\S+/g)||[];a=a.map(function(x){return x.replace(/^["']|["']$/g,'')});
      var cmd=a.shift();if(!cmd)return;var f=C[cmd]||C[cmd.toLowerCase()];
      if(!f){var near=CMDS.filter(function(c){return lev(c,cmd)<=2})[0];line('zsh: command not found: '+cmd+(near?'  (did you mean '+near+'?)':''),'e');return}
      var r=f(a);if(!r||(Array.isArray(r)&&!r.length))return;
      if(Array.isArray(r))r.forEach(function(x){if(typeof x==='string')line(x);else if(x.html)print(x.html);else if(x.err)line(x.err,'e')});
      else if(r.html)print(r.html);else if(r.err)line(r.err,'e');
    });
  }
  function lev(a,b){var m=[],i,j;for(i=0;i<=b.length;i++)m[i]=[i];for(j=0;j<=a.length;j++)m[0][j]=j;
    for(i=1;i<=b.length;i++)for(j=1;j<=a.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(b[i-1]===a[j-1]?0:1));return m[b.length][a.length]}

  // Tab 补全：命令 + 路径（文章名、目录、隐藏文件）
  var lastTab=0;
  function complete(){
    var v=inp.value,m=v.match(/^(.*?)(\S*)$/),before=m[1],word=m[2],cands;
    if(!before.trim()){cands=CMDS.filter(function(c){return c.indexOf(word)===0})}
    else{
      var cmd=before.trim().split(/\s+/)[0],slash=word.lastIndexOf('/'),dirPart=slash>=0?word.slice(0,slash+1):'',base=word.slice(slash+1),dir=resolve(dirPart||'.');
      cands=Object.keys(FS[dir]||{}).filter(function(k){return k.indexOf(base)===0&&(base[0]==='.'||k[0]!=='.')})
        .filter(function(k){return cmd!=='cd'||FS[dir][k]==='d'})
        .map(function(k){return dirPart+k+(FS[dir][k]==='d'?'/':'')});
      if((cmd==='open'||cmd==='less')&&!dirPart)cands=cands.concat(S.posts.map(function(p){return p.s}).filter(function(s){return s.indexOf(base)===0&&cands.indexOf(s+'.md')<0}));
    }
    if(!cands.length)return;
    if(cands.length===1){inp.value=before+cands[0]+(/\/$/.test(cands[0])?'':' ');return}
    var pre=cands.reduce(function(a,b){var i=0;while(i<a.length&&a[i]===b[i])i++;return a.slice(0,i)});
    if(pre.length>word.length)inp.value=before+pre;
    else if(Date.now()-lastTab<600){print('<span class="ps1">'+esc(ps1.textContent)+'</span> '+esc(v));line(cands.join('   '),'d')}
    lastTab=Date.now();
  }

  inp.addEventListener('keydown',function(e){
    if(e.key==='Enter'){var v=inp.value;inp.value='';run(v)}
    else if(e.key==='Tab'){e.preventDefault();complete()}
    else if(e.key==='ArrowUp'){e.preventDefault();if(hi>0)inp.value=hist[--hi]}
    else if(e.key==='ArrowDown'){e.preventDefault();hi<hist.length-1?inp.value=hist[++hi]:(hi=hist.length,inp.value='')}
    else if(e.key==='l'&&e.ctrlKey){e.preventDefault();C.clear()}
    else if(e.key==='c'&&e.ctrlKey&&inp.selectionStart===inp.selectionEnd){print('<span class="ps1">'+esc(ps1.textContent)+'</span> '+esc(inp.value)+'^C');inp.value=''}
    else if(e.key==='Escape')inp.blur();
  });
  function open(){box.scrollIntoView({block:'center',behavior:'smooth'});inp.focus({preventScroll:true})}
  prompt();hi=hist.length;inp.placeholder='help';
  box.addEventListener('click',function(e){if(e.target.tagName!=='A'&&!getSelection().toString())inp.focus()});
  var tb=document.querySelector('.term-btn');tb&&tb.addEventListener('click',function(e){e.preventDefault();open()});
  document.addEventListener('keydown',function(e){
    if(e.key==='`'&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName)){e.preventDefault();open()}
  });
})();
