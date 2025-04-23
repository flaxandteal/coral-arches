python manage.py packages -o import_business_data -s './coral/Group_Permission_2025-04-07.json' -ow overwrite

python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_administrative_area.xml'
python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_administrative_area_type.xml'

for file in coral/concept_collections/concepts/*; do
  python manage.py packages -o import_reference_data -s "$file"
done

python manage.py packages -o import_reference_data -s 'coral/concept_collections/first/fat_simple_collections_2.xml'

for file in coral/concept_collections/collections/*; do
  python manage.py packages -o import_reference_data -s "$file"
done