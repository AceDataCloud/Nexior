import json, os, re
EL='src/i18n/el'; EN='src/i18n/en'; ZH='src/i18n/zh-CN'
def han(s): return bool(re.search(r'[\u4e00-\u9fff]', s or ''))
def greek(s): return bool(re.search(r'[\u0370-\u03ff]', s or ''))
files = sorted(os.listdir(EL))
os.makedirs('cand', exist_ok=True)
summary={}
for f in files:
    el=json.load(open(os.path.join(EL,f)))
    en=json.load(open(os.path.join(EN,f))) if os.path.exists(os.path.join(EN,f)) else {}
    zh=json.load(open(os.path.join(ZH,f))) if os.path.exists(os.path.join(ZH,f)) else {}
    out=[]
    for k,v in el.items():
        if not isinstance(v,dict): continue
        for field in ('message','description'):
            elv=v.get(field)
            if elv is None: continue
            env=(en.get(k) or {}).get(field) if isinstance(en.get(k),dict) else None
            zhv=(zh.get(k) or {}).get(field) if isinstance(zh.get(k),dict) else None
            if elv==env==zhv: continue
            reason=None
            if han(elv): reason='CHINESE'
            elif elv==env and env is not None and not greek(elv): reason='ENG_COPY'
            if reason:
                out.append({'key':k,'field':field,'reason':reason,'el':elv,'en':env,'zh':zhv})
    if out:
        json.dump(out, open(f'cand/{f}','w'), ensure_ascii=False, indent=1)
        summary[f]=len(out)
print(json.dumps(summary, indent=1))
