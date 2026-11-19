"""DJ's masters (48 kHz, 24 bit) -> the files createGameSfx plays: 44.1 kHz, 16 bit mono WAV, <name>.wav, <name>_2.wav ...
The format is what games/shared/audio/gameSfx.test.mjs holds every game to. sources.json keeps each take's licence
trail from DJ's reports, because the game ships only the rendered files and this is the record of what they came from.
Usage: python deliver.py <dir with the set's renders> <games/farmykart/assets/sfx>"""
import glob
import json
import os
import subprocess
import sys

renders, dest = sys.argv[1], sys.argv[2]
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
with open(os.path.join(here, 'sources.json'), 'w', encoding='utf-8', newline='\n') as f:
    json.dump(trail, f, indent=1)
    f.write('\n')
print(len(trail), 'sounds', sum(len(t['takes']) for t in trail.values()), 'takes')
