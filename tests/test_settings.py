"""
ARCHES - a program developed to inventory and manage immovable cultural heritage.
Copyright (C) 2013 J. Paul Getty Trust and World Monuments Fund

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <http://www.gnu.org/licenses/>.
"""

import sys
import os
import inspect
import arches
from pathlib import Path

arches_test_path = Path(arches.__file__).parent.parent
sys.path.insert(0, str(arches_test_path))
sys.path.insert(0, str(arches_test_path / "tests"))
print(sys.path)

from tests.test_settings import *
arches_test_path = Path(__file__).parent.parent
sys.path.insert(0, str(arches_test_path))
sys.path.insert(0, str(arches_test_path / "tests"))

PACKAGE_NAME = "arches"
TEST_ROOT = os.path.normpath(os.path.join(ROOT_DIR, "..", "tests"))
APP_ROOT = ""

DOCKER = True
if DOCKER:
    try:
        from arches.settings_docker import *
    except ImportError:
        pass

try:
    from coral.settings import *
except ImportError as exc:
    print(exc)
ELASTICSEARCH_PREFIX = "test"
