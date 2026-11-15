"""Gemeinsame Pfade für alle Tests: Projektordner und Browser.
FB_CHROME=/pfad/zu/chrome setzt einen bestimmten Browser, sonst nimmt Playwright sein eigenes Chromium."""
import os, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = 'file://' + str(ROOT / 'dist') + '/'
def launch_args():
    a = {'args': ['--no-sandbox']}
    if os.environ.get('FB_CHROME'): a['executable_path'] = os.environ['FB_CHROME']
    return a
(ROOT / 'shots').mkdir(exist_ok=True)
