from django.core.management.base import BaseCommand
from django.conf import settings
import boto3
import os
from datetime import datetime
from botocore.exceptions import ClientError


dirname = os.path.dirname(__file__)
business_data_folder = os.path.join(
    dirname, "..", "..", "pkg", "business_data", "files"
)


class Command(BaseCommand):
    def add_arguments(self, parser):
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name="us-east-1",
            endpoint_url=settings.AWS_S3_ENDPOINT_URL,
        )

        parser.add_argument(
            "-o",
            "--operation",
            action="store",
            dest="operation",
            default="",
            choices=["download", "upload", "download_all"],
            help="Operation Type; "
            + "'download'=Download a specific file"
            + "'upload'=Upload a specific file"
            + "'download_all'=Download all files and overwrite existing",
        )

        parser.add_argument(
            "-s",
            "--source",
            action="store",
            dest="source",
            default="",
            help="Path to file that should be uploaded",
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
        if options["operation"] == "download":
            self.download(filename=options["filename"])

        if options["operation"] == "download_all":
            self.download_all()

        if options["operation"] == "upload":
            self.upload(source=options["source"])

    def download(self, filename):
        file_key = f"business_data/files/{filename}"
        download_path = f"{business_data_folder}/{filename}"

        try:
            print(f"Downloading {file_key} to {download_path}")
            self.s3.download_file(
                settings.AWS_STORAGE_BUCKET_NAME, file_key, download_path
            )
            print("Download successful")
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                print(
                    f"The file {file_key} does not exist in the bucket {settings.AWS_STORAGE_BUCKET_NAME}"
                )
            else:
                raise

    def download_all(self):
        prefix = "business_data/files"
        response = self.s3.list_objects_v2(
            Bucket=settings.AWS_STORAGE_BUCKET_NAME, Prefix=prefix
        )

        if "Contents" in response:
            for obj in response["Contents"]:
                key = obj["Key"]
                file_name = os.path.basename(key)
                local_file_path = os.path.join(business_data_folder, file_name)

                print(f"Downloading {key} to {local_file_path}")
                self.s3.download_file(
                    settings.AWS_STORAGE_BUCKET_NAME, key, local_file_path
                )
        else:
            print(f"No files found with prefix {prefix}")

        pass

    def upload(self, source):
        filename = source.split("/")[-1]
        original_key = f"business_data/files/{filename}"

        if self._file_exists(settings.AWS_STORAGE_BUCKET_NAME, original_key):
            self._move_file(settings.AWS_STORAGE_BUCKET_NAME, original_key)

        self._upload_file(settings.AWS_STORAGE_BUCKET_NAME, original_key, source)

    def _file_exists(self, bucket, key):
        try:
            self.s3.head_object(Bucket=bucket, Key=key)
            return True
        except self.s3.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return False
            else:
                raise

    def _move_file(self, bucket, key):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        new_key = f"backup/{key}_{timestamp}"

        self.s3.copy_object(
            Bucket=bucket, CopySource={"Bucket": bucket, "Key": key}, Key=new_key
        )
        print(f"Moved {key} to {new_key}")

        self.s3.delete_object(Bucket=bucket, Key=key)
        print(f"Deleted original file {key}")

    def _upload_file(self, bucket, key, file_path):
        self.s3.upload_file(Filename=file_path, Bucket=bucket, Key=key)
        print(f"Uploaded {file_path} to {key}")
