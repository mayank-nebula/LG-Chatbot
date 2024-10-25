Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   warn_deprecated(
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]: Traceback (most recent call last):
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/bin/gunicorn", line 8, in <module>
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     sys.exit(run())
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:              ^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/wsgiapp.py", line 66, in run
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     WSGIApplication("%(prog)s [OPTIONS] [APP_MODULE]", prog=prog).run()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/base.py", line 235, in run
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     super().run()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/base.py", line 71, in run
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     Arbiter(self).run()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     ^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/arbiter.py", line 57, in __init__
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     self.setup(app)
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/arbiter.py", line 117, in setup
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     self.app.wsgi()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/base.py", line 66, in wsgi
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     self.callable = self.load()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:                     ^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/wsgiapp.py", line 57, in load
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     return self.load_wsgiapp()
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:            ^^^^^^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/app/wsgiapp.py", line 47, in load_wsgiapp
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     return util.import_app(self.app_uri)
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/gunicorn/util.py", line 370, in import_app
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     mod = importlib.import_module(module)
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/usr/lib/python3.11/importlib/__init__.py", line 126, in import_module
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     return _bootstrap._gcd_import(name[level:], package, level)
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap>", line 1204, in _gcd_import
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap>", line 1176, in _find_and_load
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap>", line 1147, in _find_and_load_unlocked
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap>", line 690, in _load_unlocked
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap_external>", line 940, in exec_module
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "<frozen importlib._bootstrap>", line 241, in _call_with_frames_removed
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/GV/fast/main.py", line 68, in <module>
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     loaded_docstore_gpt = pickle.load(f)
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:                           ^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:   File "/home/mayank.sharma9/venv/fast_application/lib/python3.11/site-packages/pydantic/v1/main.py", line 417, in __setstate__
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:     object_setattr(self, '__fields_set__', state['__fields_set__'])
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]:                                            ~~~~~^^^^^^^^^^^^^^^^^^
Oct 25 11:28:22 Scientia-DocX-Gateway-www gunicorn[80932]: KeyError: '__fields_set__'
