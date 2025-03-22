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

import logging
from django.core.management.base import BaseCommand
from coral.utils.export_public import export_public

logging.basicConfig()

COOLOFF_S = 10

class Command(BaseCommand):
    """Export the user permission structure.

    """

    # print_statistics = False

    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--output-dir",
            action="store",
            default=None,
            dest="output_dir",
            help="Export as JSON rather than human-readable",
        )


    def handle(self, *args, **options):
        output_dir = options["output_dir"]
        export_public(output_dir)
