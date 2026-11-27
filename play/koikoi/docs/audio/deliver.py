"""DJ's renders -> the files Hanawise's createGameSfx plays: 44.1 kHz, 16 bit mono WAV, <name>.wav, <name>_2.wav ...
The format is what games/shared/audio/gameSfx.test.mjs holds every game to. Two sources:
  1. the card foley sfx-set (hanawise-sfx.yaml): DJ masters (48 kHz, 24 bit), converted with ffmpeg;
  2. the stinger kit (magestican-dj demos/kits/arbelo-hanawise-fx.yaml): already 44.1 kHz 16 bit mono through DJ's
     sound engineer, copied byte for byte.
sources.json keeps each take's licence trail and the engineer stamp, because the game ships only the rendered
files and this is the record of what they came from.
Usage: python deliver.py <sfx-set renders dir> <kit renders dir> <games/koikoi/assets/sfx>"""
import glob
import json
import os
import shutil
import subprocess
import sys

renders, kit, dest = sys.argv[1], sys.argv[2], sys.argv[3]
here = os.path.dirname(os.path.abspath(__file__))
os.makedirs(dest, exist_ok=True)
trail = {}
for report in sorted(glob.glob(f'{renders}/*/report.json')):
    with open(report, encoding='utf-8') as f:
        rep = json.load(f)
    if not rep['ok']:
        sys.exit(f"{rep['name']}: DJ's report is not ok, refusing to deliver it")
    trail[rep['name']] = {'idea': rep['idea'], 'seed': rep['seed'], 'licences': rep['licences'], 'takes': []}
    for i, v in enumerate(rep['variants']):
        name = f"{rep['name']}.wav" if i == 0 else f"{rep['name']}_{i + 1}.wav"
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(os.path.dirname(report), v['wav']),
                        '-ac', '1', '-ar', '44100', '-c:a', 'pcm_s16le', '-map_metadata', '-1', '-bitexact',
                        os.path.join(dest, name)], check=True)
        trail[rep['name']]['takes'].append({
            'file': name, 'lufs': v['lufs'], 'true_peak_db': v['true_peak_db'],
            'sources': [{k: s.get(k) for k in ('library', 'file', 'sha256', 'licence', 'licence_url')} for s in v.get('sources', [])],
        })
with open(os.path.join(kit, 'report.json'), encoding='utf-8') as f:
    krep = json.load(f)
for name in ('yaku', 'koikoi', 'win', 'lose'):
    src = os.path.join(kit, f'{name}.wav')
    stamp = src + '.engineer.json'
    if not os.path.exists(stamp):
        sys.exit(f'{name}: the kit file has no engineer stamp, refusing to deliver it (DJ RULES J15)')
    shutil.copyfile(src, os.path.join(dest, f'{name}.wav'))
    with open(stamp, encoding='utf-8') as f:
        st = json.load(f)
    trail[name] = {'kit': 'arbelo-hanawise-fx', 'takes': [{'file': f'{name}.wav', 'engineer': st}]}
with open(os.path.join(here, 'sources.json'), 'w', encoding='utf-8', newline='\n') as f:
    json.dump(trail, f, indent=1)
    f.write('\n')
print(len(trail), 'sounds', sum(len(t['takes']) for t in trail.values()), 'takes')
