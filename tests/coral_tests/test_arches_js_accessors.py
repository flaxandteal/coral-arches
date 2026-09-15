"""Guards the arches JS globals coral reaches for in error handlers.

`arches.requestFailed` was the pre-v8 spelling; translations now live under
`arches.translations.<camelCase>`, built in arches/app/media/js/arches.js from the
`.arches-translations` element. The old spelling is undefined, so an error handler using
it throws and swallows the error it was meant to display.

No database needed: `python tests/coral_tests/test_arches_js_accessors.py`
"""

import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
JS = os.path.join(ROOT, 'coral', 'media', 'js')


def js_files():
    for dirpath, dirnames, filenames in os.walk(JS):
        if 'node_modules' in dirpath or '/build' in dirpath:
            continue
        for name in filenames:
            if name.endswith('.js'):
                yield os.path.join(dirpath, name)


def test_no_pre_v8_translation_accessor():
    # `arches.requestFailed` (and friends) must go through `arches.translations`.
    stale = re.compile(r'arches\.requestFailed')
    offenders = [p for p in js_files() if stale.search(open(p, encoding='utf-8').read())]
    assert not offenders, [os.path.relpath(p, ROOT) for p in offenders]


def test_no_undefined_viewmodel_alert():
    # Nothing sets `this.viewModel`; the alert handle on a workflow card is `this.form.alert`.
    stale = re.compile(r'(this|self)\.viewModel\.alert')
    offenders = [p for p in js_files() if stale.search(open(p, encoding='utf-8').read())]
    known = {
        'coral/media/js/views/components/workflows/get-selected-monument-details-with-count.js',
        'coral/media/js/views/components/workflows/fmw-workflow/get-selected-monument-details.js',
        'coral/media/js/views/components/workflows/risk-assessment-workflow/get-ha-details.js',
        'coral/media/js/views/components/workflows/risk-assessment-workflow/get-ha-smc-details.js',
        'coral/media/js/views/components/workflows/merge-workflow/heritage-asset-map.js',
    }
    found = {os.path.relpath(p, ROOT) for p in offenders}
    assert found <= known, sorted(found - known)


if __name__ == '__main__':
    for name, fn in sorted(globals().items()):
        if name.startswith('test_'):
            fn()
    print('ok')
