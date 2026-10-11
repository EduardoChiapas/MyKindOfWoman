"""Inspect original alpha and write crop metadata; never modifies image pixels."""
from pathlib import Path
from PIL import Image
import json
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets' / 'lumo'

def frames(name, columns, rows, prefix):
    image = Image.open(ASSETS / name).convert('RGBA')
    alpha = image.getchannel('A')
    mask = np.asarray(alpha) >= 96
    def separators(projection, count, spread_factor=0.24):
        step = len(projection) / count
        edges = [0]
        # The supplied sheets have approximate grids, with extra group gaps.
        # Locate the quiet seam instead of cutting heads/tails at equal fractions.
        for index in range(1, count):
            expected = round(index * step)
            spread = max(8, round(step * spread_factor))
            start, end = max(edges[-1] + 8, expected - spread), min(len(projection) - 8, expected + spread)
            edge = min(range(start, end + 1), key=lambda p: (sum(projection[max(0,p-2):p+3]), abs(p-expected)))
            edges.append(edge)
        edges.append(len(projection))
        return edges
    row_edges = separators(mask.sum(axis=1), rows, 0.44)
    result = []
    for row in range(rows):
        y0, y1 = row_edges[row], row_edges[row + 1]
        column_edges = separators(mask[y0:y1].sum(axis=0), columns)
        for col in range(columns):
            x0, x1 = column_edges[col], column_edges[col + 1]
            # This only measures the artwork. The original alpha remains intact.
            bounds = alpha.crop((x0, y0, x1, y1)).point(lambda p: 255 if p >= 96 else 0).getbbox()
            if not bounds:
                raise ValueError(f'Empty frame {name}:{row},{col}')
            left, top, right, bottom = bounds
            left, top = max(0, left - 2), max(0, top - 2)
            right, bottom = min(x1 - x0, right + 2), min(y1 - y0, bottom + 2)
            result.append({'id': f'{prefix}-{row}-{col}', 'sheet': f'assets/lumo/{name}',
                           'rect': {'x': x0 + left, 'y': y0 + top,
                                    'width': right - left, 'height': bottom - top}})
    return result

expressions = frames('emotions-original.png', 16, 5, 'expression')
movement = frames('movement-original.png', 8, 8, 'movement')
portraits = frames('portraits-original.png', 5, 3, 'portrait')
generated = frames('generated-alternative.png', 4, 8, 'generated')

def animation(indices, fps=5, sheet=expressions):
    return {'frames': [sheet[index] for index in indices], 'fps': fps}

animations = {
    'idle': animation([0, 1, 2, 3], 4),
    'float': animation(list(range(8)), 7, movement),
    'follow': animation(list(range(8)), 9, movement),
    'sleep': animation([5, 7, 62, 7], 2),
    'laugh': animation([40, 43, 40, 43], 8),
    'mock': animation([15, 44, 15, 44], 6),
    'angry': animation([64, 65, 66, 67], 5),
    'scared': animation([34, 28, 34, 29], 7),
    'surprise': animation([28, 29, 28], 4),
    'confused': animation([72, 73, 74, 75], 4),
    'shy': animation([45, 46, 47, 46], 4),
    'sad': animation([48, 49, 50, 51], 3),
    'celebrate': animation(list(range(48, 56)), 8, movement),
    'pet': animation([56, 57, 58, 59], 6),
    # Two new cookie frames add an absent action while the original sprites
    # remain the source for all other animations and every dialogue portrait.
    'eat': animation([26, 27], 5, generated),
    'hide': animation([68, 69, 70, 71], 5),
    'observe': animation([32, 33, 34, 35], 3, movement),
    'think': animation([60, 61, 62, 63], 3),
    'support': animation([52, 53, 54, 55], 3),
}
emotion_portrait_indices = {'NORMAL': 0, 'HAPPY': 1, 'PLAYFUL': 6,
                            'ANNOYED': 10, 'SLEEPY': 11, 'CURIOUS': 2,
                            'SCARED': 3, 'CONFUSED': 7, 'SAD': 9,
                            'SUPPORTIVE': 5}
animation_portrait_indices = {'idle': 0, 'float': 0, 'follow': 0, 'sleep': 11,
                              'laugh': 6, 'mock': 13, 'angry': 10, 'scared': 3,
                              'surprise': 2, 'confused': 7, 'shy': 14, 'sad': 9,
                              'celebrate': 12, 'pet': 1, 'eat': 1, 'hide': 3,
                              'observe': 2, 'think': 7, 'support': 5}
manifest = {
    'version': 1,
    'identity': 'Lumo: original white/lavender folded hood, dark face, oval white eyes, small floating tail.',
    'render': {'nearestNeighbor': True, 'worldCanvas': {'width': 36, 'height': 48},
               'sampleCanvas': {'width': 18, 'height': 24}, 'baseline': 23},
    'sources': {'expressions': 'assets/lumo/emotions-original.png',
                'movement': 'assets/lumo/movement-original.png',
                'portraits': 'assets/lumo/portraits-original.png',
                'cookieAnimation': 'assets/lumo/generated-alternative.png'},
    'animations': animations,
    'directions': {'down': animation(list(range(8)), 8, movement),
                   'right': animation(list(range(8, 16)), 8, movement),
                   'left': animation(list(range(16, 24)), 8, movement),
                   'up': animation([40, 40, 40, 40], 5, movement)},
    'portraits': {'frames': portraits,
                 'emotions': {key: portraits[index] for key, index in emotion_portrait_indices.items()},
                 'animations': {key: portraits[index] for key, index in animation_portrait_indices.items()}},
    'quality': {'originalImagesPreserved': True,
                'transparentColorResidue': 'Blue/magenta residue is predominantly alpha 1/255; retained untouched and composited normally.',
                'alignment': 'Source crops measured from alpha >= 96. All world frames centered on the same tail baseline at runtime.',
                'portraitMode': 'Original black and white head art; runtime crop only.',
                'generation': 'Built-in image_gen; original identity retained; only cookie frames selected.'},
}
(ASSETS / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
(ASSETS / 'manifest.js').write_text("'use strict';\nwindow.LUMO_ASSETS = " + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print(json.dumps({'animations': len(animations), 'portraits': len(portraits),
                  'animationFrameCounts': {name: len(value['frames']) for name, value in animations.items()}}))
