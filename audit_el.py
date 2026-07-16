import json, os, re, sys

EL='src/i18n/el'; EN='src/i18n/en'; ZH='src/i18n/zh-CN'
def han(s): return bool(re.search(r'[\u4e00-\u9fff]', s or ''))
# Greek char presence
def greek(s): return bool(re.search(r'[\u0370-\u03ff]', s or ''))

files = sorted(os.listdir(EL))
report={}
for f in files:
    el=json.load(open(os.path.join(EL,f)))
    en=json.load(open(os.path.join(EN,f))) if os.path.exists(os.path.join(EN,f)) else {}
    zh=json.load(open(os.path.join(ZH,f))) if os.path.exists(os.path.join(ZH,f)) else {}
    issues=[]
    for k,v in el.items():
        if not isinstance(v,dict): continue
        for field in ('message','description'):
            elv=v.get(field)
            if elv is None: continue
            env=(en.get(k) or {}).get(field) if isinstance(en.get(k),dict) else None
            zhv=(zh.get(k) or {}).get(field) if isinstance(zh.get(k),dict) else None
            # skip identical in all three (intentional english technical)
            if elv==env==zhv: 
                continue
            reason=None
            if han(elv):
                reason='CHINESE'
            elif elv==env and env is not None and not greek(elv):
                # copied english (and not identical across all three), and no greek chars
                reason='ENG_COPY'
            if reason:
                issues.append((k,field,reason,elv,env,zhv))
    if issues:
        report[f]=issues

total=0
for f,iss in report.items():
    print(f'\n===== {f} ({len(iss)}) =====')
    for k,field,reason,elv,env,zhv in iss:
        total+=len(iss) and 0 or 0
        print(f'  [{reason}] {k}.{field}')
        print(f'     EL: {elv!r}')
        print(f'     EN: {env!r}')
        print(f'     ZH: {zhv!r}')
print(f'\nTOTAL files with issues: {len(report)}')
