from arches.app.models import models
from django.core.management.base import BaseCommand
import os
from arches.app.models import models
import csv
import django

dirname = os.path.dirname(__file__)
business_data_folder = os.path.join(
    dirname, "..", "..", "pkg", "business_data", "files"
)


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument(
            "-o",
            "--operation",
            action="store",
            dest="operation",
            default="",
            choices=["export", "import"],
            help="Operation Type; "
            + "'export'=Export users table as a CSV"
            + "'import'=Import a CSV containing user table data",
        )

        parser.add_argument(
            "-f",
            "--filename",
            action="store",
            dest="filename",
            default="",
            help="The name of the file as it appears in the S3 bucket",
        )

    def handle(self, *args, **options):
        if options["operation"] == "export":
            self.export_csv()

        if options["operation"] == "import":
            self.import_csv()

    def export_csv(self):
        users = list(models.User.objects.all())

        file_path = os.path.join(business_data_folder, "auth-user.csv")

        with open(file_path, "w", newline="") as csv_file:
            writer = csv.writer(csv_file)
            writer.writerow(
                [
                    "id",
                    "password",
                    "last_login",
                    "is_superuser",
                    "username",
                    "first_name",
                    "last_name",
                    "email",
                    "is_staff",
                    "is_active",
                    "date_joined",
                ]
            )

            for user in users:
                writer.writerow(
                    [
                        user.id,
                        user.password,
                        user.last_login,
                        user.is_superuser,
                        user.username,
                        user.first_name,
                        user.last_name,
                        user.email,
                        user.is_staff,
                        user.is_active,
                        user.date_joined,
                    ]
                )

    def import_csv(self):
        file_path = os.path.join(business_data_folder, "auth-user.csv")
    
        with open(file_path, newline="") as csv_file:
            reader = csv.reader(csv_file)
            header = next(reader)

            for row in reader:
                (
                    id,
                    password,
                    last_login,
                    is_superuser,
                    username,
                    first_name,
                    last_name,
                    email,
                    is_staff,
                    is_active,
                    date_joined,
                ) = row

                try:
                  models.User.objects.create(
                      id=int(id),
                      password=password,
                      last_login=last_login,
                      is_superuser=is_superuser,
                      username=username,
                      first_name=first_name,
                      last_name=last_name,
                      email=email,
                      is_staff=is_staff,
                      is_active=is_active,
                      date_joined=date_joined,
                  )
                  print(f'User with id ({id}) created in the database.')
                except django.db.utils.IntegrityError as Err:
                  print(f'User with id ({id}) already exists in the database.')
                  print('Reason: \n', Err)