from django.core.management.base import BaseCommand
from arches.app.models import models
from uuid import UUID


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-f",
            "--function_id",
            action="store",
            dest="function_id",
            default="",
            help="The function that should be targetted for a system wide run.",
        )

        parser.add_argument(
            "-r",
            "--resource_id",
            action="store",
            dest="resource_id",
            default="",
            help="Target the function run to a specific resource id.",
        )

    def handle(self, *args, **options):
        function_id = options.get('function_id')
        resource_id = options.get('resource_id')

        if not function_id:
            print('Please provide the function ID you would like to run')
            return
        
        try:
            UUID(function_id, version=4)
        except ValueError:
            print('Please provide a valid UUID for the target function')
            return
        
        if resource_id:
            try:
                UUID(resource_id, version=4)
            except ValueError:
                print('Please provide a valid UUID for the target resource')
                return
        
        function = models.Function.objects.get(functionid=function_id)

        triggering_nodegroups = function.defaultconfig.get('triggering_nodegroups')

        if not triggering_nodegroups or not len(triggering_nodegroups):
            # FIXME: These can be found by using functions x graphs to identify the graphs
            # the function belongs to after which we can filter on every tile part of their
            # nodegroups. This could be thousands so might need batches or queued.
            print('There is no triggering nodegroups assigned to this function')
            return

        tiles = models.TileModel.objects.filter(nodegroup__in=triggering_nodegroups)

        total_tiles = len(tiles)
        for idx, tile in enumerate(tiles):
            print(f'[{idx + 1}/{total_tiles}] - Saving tile with ID: ', str(tile.tileid))
            tile.save()


