"""DJ's renders -> the files Lamplighters' createGameSfx plays: 44.1 kHz, 16 bit mono WAV, <name>.wav, <name>_2.wav ...
The format is what games/shared/audio/gameSfx.test.mjs holds every game to. Three sources:
  1. the lamp foley sfx-set (lamplighters-sfx.yaml): DJ masters (48 kHz, 24 bit), converted with ffmpeg -> assets/sfx;
  2. the play stinger kit (magestican-dj demos/kits/arbelo-lamplighters-fx.yaml: close, win, lose): already 44.1 kHz
     16 bit mono through DJ's sound engineer, copied byte for byte -> assets/sfx;
  3. the menu kit (demos/kits/arbelo-lamplighters-ui.yaml): the same, with each engineer stamp beside it -> assets/ui.
sources.json keeps each take's licence trail and the engineer stamps, because the game ships only the rendered files
and this is the record of what they came from.
Usage: python deliver.py <sfx-set renders dir> <fx kit renders dir> <ui kit renders dir> <games/lamplighters/assets>"""
import glob
import json
import os
import shutil
import subprocess
import sys

renders, fx, ui, assets = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
here = os.path.dirname(os.path.abspath(__file__))
sfx_dir, ui_dir = os.path.join(assets, 'sfx'), os.path.join(assets, 'ui')
os.makedirs(sfx_dir, exist_ok=True)
os.makedirs(ui_dir, exist_ok=True)
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
                        os.path.join(sfx_dir, name)], check=True)
        trail[rep['name']]['takes'].append({
            'file': name, 'lufs': v['lufs'], 'true_peak_db': v['true_peak_db'],
            'sources': [{k: s.get(k) for k in ('library', 'file', 'sha256', 'licence', 'licence_url')} for s in v.get('sources', [])],
        })


def copy_kit(kit_dir, kit_name, names, dest, keep_stamp):
    for name in names:
        src = os.path.join(kit_dir, f'{name}.wav')
        stamp = src + '.engineer.json'
        if not os.path.exists(stamp):
            sys.exit(f'{name}: the kit file has no engineer stamp, refusing to deliver it (DJ RULES J15)')
        shutil.copyfile(src, os.path.join(dest, f'{name}.wav'))
        if keep_stamp:
            shutil.copyfile(stamp, os.path.join(dest, f'{name}.wav.engineer.json'))
        with open(stamp, encoding='utf-8') as f:
            st = json.load(f)
        trail[('ui:' if keep_stamp else '') + name] = {'kit': kit_name, 'takes': [{'file': f'{name}.wav', 'engineer': st}]}


copy_kit(fx, 'arbelo-lamplighters-fx', ('close', 'win', 'lose'), sfx_dir, False)
copy_kit(ui, 'arbelo-lamplighters-ui', ('tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus', 'error'), ui_dir, True)
with open(os.path.join(here, 'sources.json'), 'w', encoding='utf-8', newline='\n') as f:
    json.dump(trail, f, indent=1)
    f.write('\n')
print(len(trail), 'sounds', sum(len(t['takes']) for t in trail.values()), 'takes')
