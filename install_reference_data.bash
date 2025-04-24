python manage.py resources remove_resources -g 8d41e49e-a250-11e9-9eab-00224800b26d -y

python manage.py packages -o import_business_data -s './coral/Group_Permission_2025-04-07.json' -ow overwrite

python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_administrative_area.xml'
python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_administrative_area_type.xml'

for file in coral/concept_collections/concepts/*; do
  echo "==========================================================="
  echo "$file"
  echo "==========================================================="
  python manage.py packages -o import_reference_data -s "$file"
done

python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_simple_collections_2.xml'

for file in coral/concept_collections/collections/*; do
  echo "==========================================================="
  echo "$file"
  echo "==========================================================="
  python manage.py packages -o import_reference_data -s "$file"
done

python manage.py packages -o import_business_data -s './coral/dashboard_consultations.json' --escape_function -ow overwrite